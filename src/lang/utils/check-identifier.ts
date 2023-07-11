import { EditorView } from '@codemirror/view';
import { stateExtension, StateNetLogo } from '../../codemirror/extension-state-netlogo';
import { EditorState } from '@codemirror/state';
import { SyntaxNode } from '@lezer/common';
import { BreedType, CodeBlock, Procedure } from '../classes/structures';
import { LintContext, PreprocessContext } from '../classes/contexts';
import { getCodeName, getParentProcedure } from './code';
import { getBreedName, getPluralName, getSingularName } from '../../utils/breed-utils';
import { getDiagnostic } from '../linters/linter-builder';
import { addBreedAction } from './actions';
import { Diagnostic } from '@codemirror/lint';

/** CheckContext: The context of the current check. */
export interface CheckContext {
  state: EditorState;
  preprocessState: PreprocessContext;
  parseState: LintContext;
  breedNames: string[];
  breedVars: string[];
}

/* getCheckContext: gets the context of the current check. */
export const getCheckContext = function (
  view: EditorView,
  lintContext: LintContext,
  preprocessContext: PreprocessContext
): CheckContext {
  var state = view.state;
  //var parseState = state.field(stateExtension);
  return {
    state: state,
    preprocessState: preprocessContext,
    parseState: lintContext,
    breedNames: lintContext.GetBreedNames(),
    breedVars: lintContext.GetBreedVariables(),
  };
};

// always acceptable identifiers (Unrecognized is always acceptable because previous linter already errors)
export const acceptableIdentifiers = [
  'Unrecognized',
  'NewVariableDeclaration',
  'ProcedureName',
  'Arguments',
  'AnonArguments',
  'Globals',
  'BreedSingular',
  'BreedPlural',
  'BreedsOwn',
  'Extensions',
];

// checkValidIdentifier: Checks identifiers for valid variable/procedure/breed names
export const checkValidIdentifier = function (Node: SyntaxNode, value: string, context: CheckContext): boolean {
  value = value.toLowerCase();
  // checks if parent is in a category that is always valid (e.g. 'Globals')
  if (acceptableIdentifiers.includes(Node.parent?.name ?? '')) return true;
  // checks if identifier is a global variable
  if (
    context.parseState.Globals.has(value) ||
    context.parseState.WidgetGlobals.has(value) ||
    context.parseState.Procedures.has(value) ||
    context.preprocessState.Commands.has(value) ||
    context.preprocessState.Reporters.has(value)
  )
    return true;
  // checks if identifier is a breed name or variable
  if (context.breedNames.includes(value) || context.breedVars.includes(value)) return true;
  // checks if identifier is a variable already declared in the procedure
  // collects list of valid local variables for given position
  let procedureVars = getLocalVariables(Node, context.state, context.parseState);
  //checks if the identifier is in the list of possible variables
  return procedureVars.includes(value);
};

/* getLocalVariables: collects list of valid local variables for given position. */
export const getLocalVariables = function (
  Node: SyntaxNode,
  State: EditorState,
  parseState: LintContext | StateNetLogo
) {
  let procedureVars: string[] = [];
  let procedure = null;
  // get the procedure name
  var procedureName = getParentProcedure(State, Node)!;
  if (procedureName) procedure = parseState.Procedures.get(procedureName.toLowerCase());
  // If the procedure is not found, it is likely an anonymous procedure
  if (!procedure && !procedureName && State.field(stateExtension).RecognizedMode != 'Model') {
    for (var p of parseState.Procedures.values()) {
      if (p.EditorID == State.field(stateExtension).EditorID) procedure = p;
    }
  }
  // gets list of procedure variables from own procedure, as well as list of all procedure names
  if (!procedure) return procedureVars;
  procedure.Variables.map((variable) => {
    // makes sure the variable has already been created
    if (variable.CreationPos < Node.from) procedureVars.push(variable.Name);
  });
  // pulls out all local variables within the anonymous procedures up until current position
  gatherAnonymousVariables(procedure.AnonymousProcedures, Node, procedureVars);
  gatherAnonymousVariables(procedure.CodeBlocks, Node, procedureVars);
  if (procedure.Arguments) procedureVars.push(...procedure.Arguments);
  return procedureVars;
};

/* gatherAnonymousVariables: Collects out valid local variables from anonymous procedures and code blocks. */
const gatherAnonymousVariables = function (Group: CodeBlock[] | Procedure[], Node: SyntaxNode, Vars: string[]) {
  Group.map((anonProc) => {
    if (Node.from >= anonProc.PositionStart && Node.to <= anonProc.PositionEnd) {
      anonProc.Variables.map((Var) => {
        if (Var.CreationPos < Node.from) Vars.push(Var.Name);
      });
      Vars.push(...anonProc.Arguments);
      gatherAnonymousVariables(anonProc.CodeBlocks, Node, Vars);
      gatherAnonymousVariables(anonProc.AnonymousProcedures, Node, Vars);
    }
  });
};

/** checkBreed: Checks if the term in the structure of a breed command/reporter and push lint messages */
export function checkBreed(
  diagnostics: Diagnostic[],
  context: CheckContext,
  view: EditorView,
  noderef: SyntaxNode
): boolean {
  // pull out name of possible intended breed
  let value = getCodeName(view.state, noderef);
  let breedinfo = getBreedName(value);
  // if the breed name is not recognized, add the lint message
  if (breedinfo.breed !== '' && !context.breedNames.includes(breedinfo.breed)) {
    let plural = '';
    let singular = '';
    let diagnostic = getDiagnostic(view, noderef, 'Unrecognized breed name _', 'error', breedinfo.breed);
    if (breedinfo.isPlural) {
      plural = breedinfo.breed;
      singular = getSingularName(breedinfo.breed);
    } else {
      singular = breedinfo.breed;
      plural = getPluralName(breedinfo.breed);
    }
    addBreedAction(diagnostic, breedinfo.isLink ? BreedType.UndirectedLink : BreedType.Turtle, plural, singular);
    diagnostics.push(diagnostic);
    return true;
  } else return false;
}
