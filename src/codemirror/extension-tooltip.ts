import { Tooltip, showTooltip } from '@codemirror/view';
import { StateField, EditorState, EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { Dictionary } from '../i18n/dictionary';
import { StateNetLogo, stateExtension } from './extension-state-netlogo';
import { Localized } from '../i18n/localized';
import {
  classifyPrimitive,
  classifyBreedName,
  getLink,
} from './utils/tooltip_utils';

/** TooltipExtension: Extension for displaying language-specific tooltips. */
export const tooltipExtension = StateField.define<readonly Tooltip[]>({
  create: getSelectionTooltips,

  update(tooltips, tr) {
    if (!tr.docChanged && !tr.selection) return tooltips;
    return getSelectionTooltips(tr.state);
  },

  provide: (f) => showTooltip.computeN([f], (state) => state.field(f)),
});

// getSelectionTooltips: Get the tooltips for the current selection
function getSelectionTooltips(state: EditorState): readonly Tooltip[] {
  var ranges = state.selection.ranges.filter(
    (range) =>
      !range.empty &&
      state.doc.lineAt(range.from).number == state.doc.lineAt(range.to).number
  );
  if (ranges.length != 1) return [];
  return [getTooltip(ranges[0].from, ranges[0].to, state)];
}

// getTooltip: Get the tooltip for the given range
function getTooltip(from: number, to: number, state: EditorState): Tooltip {
  var NLState = state.field(stateExtension);
  // Check what to display & if the selected range covers more than one token
  var multipleTokens = false;
  var lastFrom = 0;
  var lastTo = 0;
  var closestTerm = '';
  var parentName = '';
  var secondTerm: string | null = null;
  /* Iterate inside the tree to find node with best tooltip */
  syntaxTree(state).iterate({
    enter: (ref) => {
      if (ref.from == ref.to || to == ref.from) return true;

      lastFrom = ref.from;
      lastTo = ref.to;

      // Reporters & Commands are very special
      //classify all types of reporters/commands as 'breed','custom', or builtin
      var name = classifyPrimitive(ref.name);

      // Check the category name to see if a valid closest term has been found
      if (
        closestTerm == '~BreedSingular' ||
        closestTerm == '~Arguments' ||
        closestTerm == '~ProcedureName'
      ) {
      } else if (Dictionary.Check(`~${name}`) || Localized.Get(`~${name}`)) {
        closestTerm = `~${name}`;
      } else if (
        Dictionary.Check(`~${parentName}/${name}`) ||
        Localized.Get(`~${parentName}/${name}`)
      )
        closestTerm = `~${parentName}/${name}`;

      parentName = name;
    },
    from: from,
    to: to,
  });

  // If so, we won't display tips - that's unnecessary.
  if (lastFrom == lastTo || multipleTokens) return getEmptyTooltip();

  /* Search for better tooltip depending on selected text */

  // Check if we can directly recognize the youngest children's full-word
  const term = state.sliceDoc(lastFrom, lastTo);
  // check primitive dictionary
  if (Dictionary.Check(term)) {
    closestTerm = term;
  }
  // check if term is a global variable
  else if (state.field(stateExtension).Globals.includes(term)) {
    closestTerm = '~Globals/Identifier';
  }
  //check if term is a widget global variable
  else if (state.field(stateExtension).WidgetGlobals.includes(term)) {
    closestTerm = '~WidgetGlobal';
  }
  //check if term is the name of a breed
  else if (state.field(stateExtension).GetBreedNames().includes(term)) {
    closestTerm = classifyBreedName(
      term,
      state.field(stateExtension).GetBreeds()
    );
  }
  //otherwise check if term is a breed variable
  else {
    secondTerm = NLState.GetBreedFromVariable(term);
    if (secondTerm != null) {
      closestTerm = '~BreedVariable';
    } else {
      //if term is not a breed variable, check if it is a local variable for a procedure
      if (
        closestTerm == '~VariableName' ||
        (parentName == 'Identifier' && closestTerm == '')
      ) {
        secondTerm = NLState.GetProcedureFromVariable(term, lastFrom, lastTo);
        //if procedure cannot be identified, term is an unidentified local variable
        if (secondTerm != null) closestTerm = '~LocalVariable';
      }
    }
  }
  //get breed name from breed commands and reporters (e.g. 'create-____')
  if (closestTerm == '~BreedReporter' || closestTerm == '~BreedCommand') {
    secondTerm = NLState.GetBreedFromProcedure(term);
  }

  console.log('Term: ' + term, closestTerm, parentName);
  if (closestTerm == '') return getEmptyTooltip();

  // Check if there is an internal link for the tooltip
  // (e.g. first mention of a variable, or a procedure name)
  let result = getInternalLink(
    term,
    closestTerm,
    secondTerm ?? '',
    state,
    NLState
  );

  // Return the tooltip
  return {
    pos: from,
    above: false,
    strictSide: true,
    arrow: true,
    create: (view: EditorView) => {
      const dom = document.createElement('div');
      // get message from dictionary/localized
      var message = Dictionary.Get(closestTerm, secondTerm ?? '');
      if (Dictionary.ClickHandler != null && !closestTerm.startsWith('~')) {
        message += '➤';
        dom.addEventListener('click', () => Dictionary.ClickHandler!(term));
        dom.classList.add('cm-tooltip-extendable');
      }
      // if tooltip has internal link, it is added here
      else if (result.hasLink) {
        message += '➤';
        dom.addEventListener('click', () =>
          view.dispatch({
            selection: EditorSelection.create([
              EditorSelection.range(result.from, result.to),
            ]),
            effects: [EditorView.scrollIntoView(result.from, { y: 'center' })],
          })
        );
        dom.classList.add('cm-tooltip-extendable');
      }
      dom.classList.add('cm-tooltip-explain');
      dom.innerText = message;
      return { dom };
    },
  };
}

/** getEmptyTooltip: Get an empty tooltip. */
function getEmptyTooltip(): Tooltip {
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
// e.g. variables would link to first declaration
function getInternalLink(
  term: string,
  closestTerm: string,
  secondTerm: string,
  state: EditorState,
  NLState: StateNetLogo
): { hasLink: boolean; to: number; from: number } {
  let linkData = {
    to: 0,
    from: 0,
    hasLink: false,
  };
  // link to declaration of global variable or breed
  if (closestTerm == '~Globals/Identifier') {
    linkData = getLink('Globals', 'Identifier', term, state);
  } else if (closestTerm == '~BreedSingular') {
    linkData = getLink('Breed', 'BreedSingular', term, state);
  } else if (closestTerm == '~BreedPlural') {
    linkData = getLink('Breed', 'BreedPlural', term, state);
  }
  // link to node where the breed variable is created
  else if (closestTerm == '~BreedVariable') {
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
                linkData.to = subnode.to;
                linkData.from = subnode.from;
                linkData.hasLink = true;
              }
            });
          }
        }
      });
  }
  //link to start of the procedure being called
  else if (
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
          linkData.to = node.to;
          linkData.from = node.from;
          linkData.hasLink = true;
        }
      });
  }
  // link to node where local variable is defined
  // this is more complex because local variables can be nested inside blocks or
  // multiple procedures can have local variables with the same name
  else if (closestTerm == '~LocalVariable') {
    let procName = secondTerm.replace('{anonymous},', '');
    let proc = NLState.Procedures.get(procName);
    if (!proc) return linkData;
    // if term is an argument, link to argument's location
    if (proc.Arguments.includes(term)) {
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
                    linkData.to = subnode.to;
                    linkData.from = subnode.from;
                    linkData.hasLink = true;
                  }
                });
            }
          }
        });
    }
    // link to creation pos for non-anonymous procedures
    else if (!secondTerm.includes('{anonymous}')) {
      for (let vars of proc.Variables) {
        if (vars.Name == term) {
          let subnode = syntaxTree(state).cursorAt(vars.CreationPos).node;
          linkData.to = subnode.to;
          linkData.from = subnode.from;
          linkData.hasLink = true;
        }
      }
    } else {
      for (var anonProc of proc.AnonymousProcedures) {
        // link to argument of anonymous procedure
        if (anonProc.Arguments.includes(term)) {
          syntaxTree(state).iterate({
            enter: (noderef) => {
              if (
                noderef.name == 'Identifier' &&
                (noderef.node.parent?.name == 'AnonArguments' ||
                  noderef.node.parent?.name == 'Arguments')
              ) {
                if (state.sliceDoc(noderef.from, noderef.to) == term) {
                  linkData.to = noderef.to;
                  linkData.from = noderef.from;
                  linkData.hasLink = true;
                }
              }
            },
            to: anonProc.PositionStart,
            from: anonProc.PositionEnd,
          });
        }
        // link to local variable of anonymous procedure
        else {
          for (var vars of anonProc.Variables) {
            if (vars.Name == term) {
              let subnode = syntaxTree(state).cursorAt(vars.CreationPos).node;
              linkData.to = subnode.to;
              linkData.from = subnode.from;
              linkData.hasLink = true;
            }
          }
        }
      }
    }
  }

  return linkData;
}
