import { syntaxTree } from '@codemirror/language';
import { linter, Diagnostic } from '@codemirror/lint';
import { SyntaxNode } from '@lezer/common';
import { EditorState } from '@codemirror/state';
import { preprocessStateExtension } from '../../codemirror/extension-regex-state';
import { PrimitiveManager } from '../primitives/primitives';
import { NetLogoType } from '../classes';
import { Localized } from '../../i18n/localized';

let primitives = PrimitiveManager;

// Checks number of arguments
export const ArgumentLinter = linter((view) => {
  const diagnostics: Diagnostic[] = [];
  syntaxTree(view.state)
    .cursor()
    .iterate((noderef) => {
      if (
        //checking let/set statements
        (noderef.name == 'SetVariable' &&
          (noderef.node.getChildren('VariableName').length != 1 ||
            noderef.node.getChildren('Value').length != 1)) ||
        (noderef.name == 'NewVariableDeclaration' &&
          (noderef.node.getChildren('Identifier').length != 1 ||
            noderef.node.getChildren('Value').length != 1))
      ) {
        let func = noderef.name == 'SetVariable' ? 'Set' : 'Let';
        let expected = 2;
        let actual =
          noderef.name == 'SetVariable'
            ? noderef.node.getChildren('VariableName').length +
              noderef.node.getChildren('Value').length
            : noderef.node.getChildren('Identifier').length +
              noderef.node.getChildren('Value').length;
        diagnostics.push({
          from: noderef.from,
          to: noderef.to,
          severity: 'error',
          message: Localized.Get(
            'Too few right args for _. Expected _, found _.',
            func,
            expected.toString(),
            actual.toString()
          ),
        });
      } else if (
        (noderef.name == 'ReporterStatement' ||
          noderef.name == 'CommandStatement') &&
        noderef.node.getChildren('Arg')
      ) {
        const Node = noderef.node;
        const value = view.state
          .sliceDoc(noderef.from, noderef.to)
          .toLowerCase();
        //checking if missing command (it shows up as a specific grammatical structure)
        if (Node.firstChild?.name == '⚠') {
          diagnostics.push({
            from: Node.from,
            to: Node.to,
            severity: 'warning',
            message: Localized.Get('Missing command before _', value),
          });
        }
        let args = getArgs(Node);
        //ensures there is a primitive to check
        if (Node.getChildren('VariableDeclaration').length == 0 && args.func) {
          //identify the errors and terms to be conveyed in error message
          const result = checkValid(Node, value, view.state, args);
          let error_type = result[0];
          let func = result[1];
          let expected = result[2];
          let actual = result[3];
          //create error messages
          if (error_type == 'no primitive') {
            diagnostics.push({
              from: noderef.from,
              to: noderef.to,
              severity: 'error',
              message: Localized.Get(
                'Problem identifying primitive _. Expected _, found _.',
                func.toString(),
                expected.toString(),
                actual.toString()
              ),
            });
          } else if (error_type == 'left') {
            diagnostics.push({
              from: noderef.from,
              to: noderef.to,
              severity: 'error',
              message: Localized.Get(
                'Left args for _. Expected _, found _.',
                func.toString(),
                expected.toString(),
                actual.toString()
              ),
            });
          } else if (error_type == 'rightmin') {
            diagnostics.push({
              from: noderef.from,
              to: noderef.to,
              severity: 'error',
              message: Localized.Get(
                'Too few right args for _. Expected _, found _.',
                func.toString(),
                expected.toString(),
                actual.toString()
              ),
            });
          } else if (error_type == 'rightmax') {
            diagnostics.push({
              from: noderef.from,
              to: noderef.to,
              severity: 'error',
              message: Localized.Get(
                'Too many right args for _. Expected _, found _.',
                func.toString(),
                expected.toString(),
                actual.toString()
              ),
            });
          }
        }
      }
    });
  return diagnostics;
});

//collects everything used as an argument so it can be counted
export const getArgs = function (Node: SyntaxNode) {
  let cursor = Node.cursor();
  let args: {
    leftArgs: SyntaxNode | null;
    rightArgs: SyntaxNode[];
    func: SyntaxNode | null;
  } = { leftArgs: null, rightArgs: [], func: null };
  let seenFunc = false;
  let done = false;
  if (!cursor.firstChild()) {
    return args;
  }
  while (done == false) {
    //collect nodes containing left args
    if (!seenFunc && cursor.node.name == 'Arg') {
      args.leftArgs = cursor.node;
    } else if (
      //collect nodes containing right args ('Commands'/'Reporters' are specifically for map, filter, etc.)
      seenFunc &&
      (cursor.node.name == 'Arg' ||
        cursor.node.name == 'Commands' ||
        cursor.node.name == 'Reporters')
    ) {
      args.rightArgs.push(cursor.node);
    } else if (
      //identify the node containing primitive
      (cursor.node.name.includes('Command') &&
        !cursor.node.name.includes('Commands')) ||
      (cursor.node.name.includes('Reporter') &&
        !cursor.node.name.includes('Reporters'))
    ) {
      args.func = cursor.node;
      seenFunc = true;
    }
    if (!cursor.nextSibling()) {
      done = true;
    }
  }
  return args;
};

//checks if correct number of arguments are present
export const checkValid = function (
  Node: SyntaxNode,
  value: string,
  state: EditorState,
  args: {
    leftArgs: SyntaxNode | null;
    rightArgs: SyntaxNode[];
    func: SyntaxNode | null;
  }
) {
  //get the text/name of the primitive
  let func = state.sliceDoc(args.func?.from, args.func?.to).toLowerCase();
  //checking for "Special" cases (custom and breed procedures)
  if (args.func?.name.includes('Special')) {
    let numArgs =
      state.field(preprocessStateExtension).Commands[func] ??
      state.field(preprocessStateExtension).Reporters[func] ??
      getBreedCommandArgs(func) ??
      getBreedProcedureArgs(args.func.name);
    return [
      numArgs == args.rightArgs.length,
      func,
      numArgs,
      args.rightArgs.length,
    ];
  } else {
    let primitive = primitives.GetNamedPrimitive(func);
    //checks for terms used as primitives but don't exist in our dataset
    if (!primitive) {
      console.log('no primitive', args.func?.name, func);
      return ['no primitive', func, 0, 0];
    } else if (
      //checks for incorrect numbers of arguments on the left side
      (primitive.LeftArgumentType?.Types[0] == NetLogoType.Unit &&
        args.leftArgs) ||
      (primitive.LeftArgumentType?.Types[0] != NetLogoType.Unit &&
        !args.leftArgs)
    ) {
      console.log('left args');
      let expected =
        primitive.LeftArgumentType?.Types[0] != NetLogoType.Unit ? 1 : 0;
      let actual = args.leftArgs ? 1 : 0;
      console.log('left', expected, actual);
      return ['left', func, expected, actual];
    } else {
      //find the minimum and maximum acceptable numbers of right-side arguments
      let rightArgMin =
        primitive.MinimumOption ??
        primitive.DefaultOption ??
        primitive.RightArgumentTypes.filter((arg) => arg.Optional == false)
          .length;
      let rightArgMax =
        primitive.RightArgumentTypes.filter((arg) => arg.CanRepeat).length > 0
          ? 100
          : primitive.RightArgumentTypes.length;
      //ensure at least minimum # right args present
      if (args.rightArgs.length < rightArgMin) {
        console.log(args.rightArgs);
        console.log(
          func,
          'rightargs',
          rightArgMin,
          rightArgMax,
          args.rightArgs.length
        );
        return ['rightmin', func, rightArgMin, args.rightArgs.length];
        //ensure at most max # right args present
      } else if (args.rightArgs.length > rightArgMax) {
        return ['rightmax', func, rightArgMax, args.rightArgs.length];
      } else {
        return [true, func, 0, 0];
      }
    }
  }
};

//get number of args for breed procedures that are commands
const getBreedCommandArgs = function (func: string) {
  if (func.match(/^(hatch|sprout|create|create-ordered)-\w+/)) {
    return 2;
  } else if (func.match(/^create-\w+-(to|from|with)$/)) {
    return 2;
  } else {
    return null;
  }
};

//parse # args from node name
const getBreedProcedureArgs = function (func_type: string) {
  let match = func_type.match(/[A-Za-z]*(\d)[A-Za-z]*/);
  if (match) {
    return parseInt(match[1]);
  } else {
    return null;
  }
};