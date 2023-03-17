import { Tooltip, showTooltip } from '@codemirror/view';
import { StateField, EditorState, EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { Dictionary } from '../i18n/dictionary';
import { SyntaxNode } from '@lezer/common';
import { stateExtension } from './extension-state-netlogo';
import { Localized } from '../i18n/localized';

/** TooltipExtension: Extension for displaying language-specific tooltips. */
export const tooltipExtension = StateField.define<readonly Tooltip[]>({
  create: getCursorTooltips,

  update(tooltips, tr) {
    if (!tr.docChanged && !tr.selection) return tooltips;
    return getCursorTooltips(tr.state);
  },

  provide: (f) => showTooltip.computeN([f], (state) => state.field(f)),
});

function getCursorTooltips(state: EditorState): readonly Tooltip[] {
  var State = state.field(stateExtension);
  return state.selection.ranges
    .filter(
      (range) =>
        !range.empty &&
        state.doc.lineAt(range.from).number == state.doc.lineAt(range.to).number
    )
    .map((range) => {
      // Check what to display & if the selected range covers more than one token
      var multipleTokens = false;
      var lastFrom = 0,
        lastTo = 0;
      var closestTerm = '';
      var parentName = '';
      var secondTerm: string | null = null;
      // Iterate inside the tree
      syntaxTree(state).iterate({
        enter: (ref) => {
          if (ref.from == ref.to || ref.to == range.from) return true;
          lastFrom = ref.from;
          lastTo = ref.to;
          if (ref.to < range.to) {
            multipleTokens = true;
            return false;
          }
          // Reporters & Commands are very special
          var name = ref.name;
          if (name.indexOf('Reporter') != -1 && name.indexOf('Args') != -1) {
            if (name.indexOf('Special') != -1) {
              if (
                name.indexOf('Turtle') != -1 ||
                name.indexOf('Link') != -1 ||
                name.indexOf('Both') != -1
              ) {
                name = 'BreedReporter';
              } else {
                name = 'CustomReporter';
              }
            } else {
              name = 'Reporter';
            }
          }

          if (name.indexOf('Command') != -1) {
            if (name.indexOf('Special') != -1) {
              if (name.indexOf('Create') != -1) {
                name = 'BreedCommand';
              } else {
                name = 'CustomCommand';
              }
            } else {
              name = 'Command';
            }
          }

          // Check the category name
          if (
            closestTerm == '~BreedSingular' ||
            closestTerm == '~Arguments' ||
            closestTerm == '~ProcedureName'
          ) {
          } else if (
            Dictionary.Check(`~${name}`) ||
            Localized.Get(`~${name}`)
          ) {
            closestTerm = `~${name}`;
          } else if (
            Dictionary.Check(`~${parentName}/${name}`) ||
            Localized.Get(`~${parentName}/${name}`)
          )
            closestTerm = `~${parentName}/${name}`;

          parentName = name;
        },
        from: range.from,
        to: range.to,
      });

      // If so, we won't display tips - that's unnecessary.
      if (lastFrom == lastTo || multipleTokens) return getEmptyTooltip();

      // Check if we can directly recognize the youngest children's full-word
      const term = state.sliceDoc(lastFrom, lastTo);
      if (Dictionary.Check(term)) {
        closestTerm = term;
      } else if (state.field(stateExtension).Globals.includes(term)) {
        closestTerm = '~Globals/Identifier';
      } else if (state.field(stateExtension).WidgetGlobals.includes(term)) {
        closestTerm = '~WidgetGlobal';
      } else if (state.field(stateExtension).GetBreedNames().includes(term)) {
        let breeds = state.field(stateExtension).GetBreeds();
        let plurals: string[] = [];
        let singular: string[] = [];
        for (let b of breeds) {
          plurals.push(b.Plural);
          singular.push(b.Singular);
        }
        if (plurals.includes(term)) {
          closestTerm = '~BreedPlural';
        } else {
          closestTerm = '~BreedSingular';
        }
      } else {
        secondTerm = State.GetBreedFromVariable(term);
        if (secondTerm != null) {
          closestTerm = '~BreedVariable';
        } else {
          if (
            closestTerm == '~VariableName' ||
            (parentName == 'Identifier' && closestTerm == '')
          ) {
            secondTerm = State.GetProcedureFromVariable(term, lastFrom, lastTo);
            if (secondTerm != null) closestTerm = '~LocalVariable';
          }
        }
      }
      if (closestTerm == '~BreedReporter' || closestTerm == '~BreedCommand') {
        secondTerm = State.GetBreedFromProcedure(term);
      }

      console.log('Term: ' + term, closestTerm, parentName);
      if (closestTerm == '') return getEmptyTooltip();

      let result = getInternalLink(term, closestTerm, secondTerm ?? '', state);
      console.log(result);

      // Return the tooltip
      return {
        pos: range.from,
        above: false,
        strictSide: true,
        arrow: true,
        create: (view: EditorView) => {
          const dom = document.createElement('div');
          var message = Dictionary.Get(closestTerm, secondTerm ?? '');
          if (Dictionary.ClickHandler != null && !closestTerm.startsWith('~')) {
            message += '➤';
            dom.addEventListener('click', () => Dictionary.ClickHandler!(term));
            dom.classList.add('cm-tooltip-extendable');
          } else if (result.hasLink) {
            message += '➤';
            dom.addEventListener('click', () =>
              view.dispatch({
                selection: EditorSelection.create([
                  EditorSelection.range(result.from, result.to),
                ]),
                effects: [
                  EditorView.scrollIntoView(result.from, { y: 'center' }),
                ],
              })
            );
            dom.classList.add('cm-tooltip-extendable');
          }
          dom.classList.add('cm-tooltip-explain');
          dom.innerText = message;
          return { dom };
        },
      };
    });
}

/** getEmptyTooltip: Get an empty tooltip. */
function getEmptyTooltip() {
  return {
    pos: 0,
    above: false,
    strictSide: true,
    arrow: false,
    create: (view: EditorView) => {
      const dom = document.createElement('div');
      return { dom };
    },
  };
}

/** getInternalLink: Get an internal link for the tooltip. */
function getInternalLink(
  term: string,
  closestTerm: string,
  secondTerm: string,
  state: EditorState
): { hasLink: boolean; to: number; from: number } {
  let to = 0;
  let from = 0;
  let hasLink = false;

  if (closestTerm == '~Globals/Identifier') {
    syntaxTree(state)
      .cursor()
      .iterate((node) => {
        if (node.name == 'Globals') {
          node.node.getChildren('Identifier').map((subnode) => {
            if (state.sliceDoc(subnode.from, subnode.to) == term) {
              to = subnode.to;
              from = subnode.from;
              hasLink = true;
            }
          });
        }
      });
  } else if (closestTerm == '~BreedVariable') {
    syntaxTree(state)
      .cursor()
      .iterate((node) => {
        if (node.name == 'BreedsOwn') {
          let correctNode = false;
          node.node.getChildren('Own').map((subnode) => {
            if (
              state.sliceDoc(subnode.from, subnode.to) ==
              secondTerm + '-own'
            ) {
              correctNode = true;
            }
          });
          if (correctNode) {
            node.node.getChildren('Identifier').map((subnode) => {
              if (state.sliceDoc(subnode.from, subnode.to) == term) {
                to = subnode.to;
                from = subnode.from;
                hasLink = true;
              }
            });
          }
        }
      });
  } else if (closestTerm == '~BreedSingular') {
    syntaxTree(state)
      .cursor()
      .iterate((node) => {
        if (node.name == 'Breed') {
          node.node.getChildren('BreedSingular').map((subnode) => {
            if (state.sliceDoc(subnode.from, subnode.to) == term) {
              to = subnode.to;
              from = subnode.from;
              hasLink = true;
            }
          });
        }
      });
  } else if (closestTerm == '~BreedPlural') {
    syntaxTree(state)
      .cursor()
      .iterate((node) => {
        if (node.name == 'Breed') {
          node.node.getChildren('BreedPlural').map((subnode) => {
            if (state.sliceDoc(subnode.from, subnode.to) == term) {
              to = subnode.to;
              from = subnode.from;
              hasLink = true;
            }
          });
        }
      });
  } else if (
    closestTerm == '~CustomReporter' ||
    closestTerm == '~CustomCommand'
  ) {
    syntaxTree(state)
      .cursor()
      .iterate((node) => {
        if (node.name == 'ProcedureName')
          console.log(state.sliceDoc(node.from, node.to));
        if (
          node.name == 'ProcedureName' &&
          state.sliceDoc(node.from, node.to) == term
        ) {
          to = node.to;
          from = node.from;
          hasLink = true;
        }
      });
  } else if (closestTerm == '~LocalVariable') {
    let procName = secondTerm.replace('{anonymous},', '');
    let proc = state.field(stateExtension).Procedures.get(procName);
    if (proc?.Arguments.includes(term)) {
      syntaxTree(state)
        .cursor()
        .iterate((node) => {
          if (node.name == 'Procedure') {
            let nameNode = node.node.getChild('ProcedureName');
            if (
              nameNode &&
              state.sliceDoc(nameNode.from, nameNode.to) == procName
            ) {
              node.node
                .getChild('Arguments')
                ?.getChildren('Identifier')
                .map((subnode) => {
                  if (state.sliceDoc(subnode.from, subnode.to) == term) {
                    to = subnode.to;
                    from = subnode.from;
                    hasLink = true;
                  }
                });
            }
          }
        });
    } else if (proc && !secondTerm.includes('{anonymous}')) {
      for (let vars of proc?.Variables) {
        if (vars.Name == term) {
          let subnode = syntaxTree(state).cursorAt(vars.CreationPos).node;
          to = subnode.to;
          from = subnode.from;
          hasLink = true;
        }
      }
    } else if (proc) {
      for (var anonProc of proc.AnonymousProcedures) {
        if (anonProc.Arguments.includes(term)) {
          syntaxTree(state).iterate({
            enter: (noderef) => {
              if (
                noderef.name == 'Identifier' &&
                (noderef.node.parent?.name == 'AnonArguments' ||
                  noderef.node.parent?.name == 'Arguments')
              ) {
                if (state.sliceDoc(noderef.from, noderef.to) == term) {
                  to = noderef.to;
                  from = noderef.from;
                  hasLink = true;
                }
              }
            },
            to: anonProc.PositionStart,
            from: anonProc.PositionEnd,
          });
        } else {
          for (var vars of anonProc.Variables) {
            if (vars.Name == term) {
              let subnode = syntaxTree(state).cursorAt(vars.CreationPos).node;
              to = subnode.to;
              from = subnode.from;
              hasLink = true;
            }
          }
        }
      }
    }
  }

  return { hasLink, to, from };
}
