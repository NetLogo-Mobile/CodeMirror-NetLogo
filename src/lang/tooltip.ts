import { Diagnostic } from '@codemirror/lint';
import { EditorState, EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { Dictionary } from '../i18n/dictionary';
import { classifyPrimitive, classifyBreedName, getLink } from '../utils/tooltip-utils';
import { GalapagosEditor, Localized } from '../editor';
import { Log } from '../utils/debug-utils';
import { getCodeName } from './utils/code';
import { MatchBreed } from './parsers/breed';
import { LintContext } from './classes/contexts';

/** getTooltip: Get the tooltip for the given range as a pseudo Diagnostic. */
export function getTooltip(
  view: EditorView,
  from: number,
  to: number,
  editor: GalapagosEditor
): Diagnostic | undefined {
  var lintContext = editor.LintContext;
  var preprocess = editor.PreprocessContext;
  var lastFrom = 0;
  var lastTo = 0;
  var closestTerm = '';
  var parentName = '';
  var secondTerm: string | null = null;
  /* Iterate inside the tree to find node with best tooltip */
  syntaxTree(view.state).iterate({
    enter: (ref) => {
      if (ref.from == ref.to || to == ref.from) return true;

      lastFrom = ref.from;
      lastTo = ref.to;

      // Reporters & Commands are very special
      // Classify all types of reporters/commands as 'breed', 'custom', or builtin
      var name = classifyPrimitive(ref.name);

      // Check the category name to see if a valid closest term has been found
      if (closestTerm == '~BreedSingular' || closestTerm == '~Arguments' || closestTerm == '~ProcedureName') {
      } else if (Dictionary.Check(`~${name}`) || Localized.Get(`~${name}`) != `~${name}`) {
        closestTerm = `~${name}`;
      } else if (
        Dictionary.Check(`~${parentName}/${name}`) ||
        Localized.Get(`~${parentName}/${name}`) != `~${parentName}/${name}`
      )
        closestTerm = `~${parentName}/${name}`;

      parentName = name;
    },
    from: from,
    to: to,
  });
  // If so, we won't display tips - that's unnecessary.
  if (lastFrom == lastTo) return;

  /* Search for better tooltip depending on selected text */
  // Check if we can directly recognize the youngest children's full-word
  const term = getCodeName(view.state, { from: lastFrom, to: lastTo });
  // check primitive dictionary
  if (Dictionary.Check(term)) {
    closestTerm = term;
  } else if (lintContext.Globals.has(term)) {
    // check if term is a global variable
    closestTerm = '~Globals/Identifier';
  } else if (lintContext.WidgetGlobals.has(term)) {
    // check if term is a widget global variable
    closestTerm = '~WidgetGlobal';
  } else if (lintContext.GetBreedNames().includes(term)) {
    // check if term is the name of a breed
    closestTerm = classifyBreedName(term, lintContext.GetBreeds());
  } else {
    // therwise check if term is a breed variable
    secondTerm = lintContext.GetBreedFromVariable(term);
    if (secondTerm != null) {
      closestTerm = '~BreedVariable';
    } else {
      // if term is not a breed variable, check if it is a local variable for a procedure
      if (
        closestTerm == '~VariableName' ||
        closestTerm == '~NewVariableDeclaration/Identifier' ||
        (parentName == 'Identifier' && closestTerm == '')
      ) {
        secondTerm = lintContext.GetProcedureFromVariable(term, lastFrom, lastTo);
        // console.log("SECOND",secondTerm)
        // if procedure cannot be identified, term is an unidentified local variable
        if (secondTerm != null) closestTerm = '~LocalVariable';
        else closestTerm = '~VariableName';
      }
    }
  }
  // get breed name from breed commands and reporters (e.g. 'create-____')
  if (closestTerm == '~BreedReporter' || closestTerm == '~BreedCommand') {
    var match = MatchBreed(term, preprocess);
    if (match.Valid && match.Plural) {
      if (match.Prototype && Dictionary.Check(match.Prototype)) closestTerm = match.Prototype;
      secondTerm = match.Plural;
    } else {
      secondTerm = 'Unknown';
    }
  }

  Log('Term: ' + term, closestTerm, parentName);
  if (closestTerm == '') return;

  // Check if there is an internal link for the tooltip
  // (e.g. first mention of a variable, or a procedure name)
  let result = getInternalLink(term, closestTerm, secondTerm ?? '', view.state, lintContext);

  // Return the tooltip
  return {
    from: lastFrom,
    to: lastTo,
    severity: 'info',
    message: '',
    renderMessage: () => {
      const dom = document.createElement('span');
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
            selection: EditorSelection.create([EditorSelection.range(result.from, result.to)]),
            effects: [EditorView.scrollIntoView(result.from, { y: 'center' })],
          })
        );
        dom.classList.add('cm-tooltip-extendable');
      }
      dom.innerText = message;
      return dom;
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
  lintContext: LintContext
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
            if (getCodeName(state, subnode) == secondTerm + '-own') correctNode = true;
          });
          if (correctNode) {
            node.node.getChildren('Identifier').map((subnode) => {
              if (getCodeName(state, subnode) == term) {
                linkData.to = subnode.to;
                linkData.from = subnode.from;
                linkData.hasLink = true;
              }
            });
          }
        }
      });
  }
  // link to start of the procedure being called
  else if (closestTerm == '~CustomReporter' || closestTerm == '~CustomCommand') {
    syntaxTree(state)
      .cursor()
      .iterate((node) => {
        if (node.name == 'ProcedureName' && getCodeName(state, node) == term) {
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
    let proc = lintContext.Procedures.get(procName);
    if (!proc) return linkData;
    // if term is an argument, link to argument's location
    if (proc.Arguments.includes(term)) {
      syntaxTree(state)
        .cursor()
        .iterate((node) => {
          if (node.name == 'Procedure') {
            let nameNode = node.node.getChild('ProcedureName');
            if (nameNode && getCodeName(state, nameNode) == procName) {
              node.node
                .getChild('Arguments')
                ?.getChildren('Identifier')
                .map((subnode) => {
                  if (getCodeName(state, subnode) == term) {
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
                (noderef.node.parent?.name == 'AnonArguments' || noderef.node.parent?.name == 'Arguments')
              ) {
                if (getCodeName(state, noderef) == term) {
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
