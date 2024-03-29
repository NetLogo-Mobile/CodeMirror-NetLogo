import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { SyntaxNode } from '@lezer/common';
import { PrimitiveManager } from '../primitives/primitives';
import { NetLogoType } from '../classes/structures';
import { Linter, getDiagnostic } from './linter-builder';
import { PreprocessContext } from '../classes/contexts';
import { Log } from '../../utils/debug-utils';
import { getCodeName } from '../utils/code';

let primitives = PrimitiveManager;

// ArgumentLinter: ensure all primitives have an acceptable number of arguments
export const ArgumentLinter: Linter = (view, preprocessContext, lintContext) => {
  const diagnostics: Diagnostic[] = [];
  syntaxTree(view.state)
    .cursor()
    .iterate((noderef) => {
      if (
        // Checking let/set statements
        (noderef.name == 'SetVariable' &&
          (noderef.node.getChildren('VariableName').length != 1 ||
            noderef.node.getChildren('Value').length + noderef.node.getChildren('ReporterStatement').length != 1)) ||
        (noderef.name == 'NewVariableDeclaration' &&
          (noderef.node.getChildren('Identifier').length + noderef.node.getChildren('UnsupportedPrim').length != 1 ||
            noderef.node.getChildren('Value').length + noderef.node.getChildren('ReporterStatement').length != 1))
      ) {
        let func = noderef.name == 'SetVariable' ? 'Set' : 'Let';
        let expected = 2;
        let child_count = 0;
        let cursor = noderef.node.cursor();
        if (cursor.firstChild()) {
          while (cursor.nextSibling()) {
            if (cursor.from != cursor.to) child_count++;
          }
        }
        let actual = child_count;
        // noderef.name == 'SetVariable'
        //   ? noderef.node.getChildren('VariableName').length + noderef.node.getChildren('Value').length
        //   : noderef.node.getChildren('Identifier').length +
        //   noderef.node.getChildren('UnsupportedPrim').length +
        //   noderef.node.getChildren('Value').length;
        if (actual < expected) {
          diagnostics.push(
            getDiagnostic(
              view,
              noderef.node,
              'Too few right args for _. Expected _, found _.',
              'error',
              func,
              expected.toString(),
              actual.toString()
            )
          );
        }
      } else if (noderef.name == 'ReporterStatement' || noderef.name == 'CommandStatement') {
        // noderef.node.getChildren('Arg').map((arg)=> console.log(getCodeName(view.state, arg)))
        const Node = noderef.node;
        // Checking if missing command (it shows up as a specific grammatical structure)
        if (Node.firstChild?.name == '⚠') diagnostics.push(getDiagnostic(view, Node, 'Missing command _'));
        // Checking the arguments
        let args = getArgs(Node);
        // Ensures there is a primitive to check
        if (Node.getChildren('VariableDeclaration').length == 0 && args.func) {
          // identify the errors and terms to be conveyed in error message
          const result = checkValidNumArgs(view.state, args, preprocessContext);
          let error_type = result[0];
          let func = result[1];
          let expected = result[2];
          let actual = result[3];
          //console.log(func,expected,actual,error_type)
          if (func == null || expected == null || actual == null) {
          }
          // create error messages
          else if (error_type == 'no primitive') {
            diagnostics.push(
              getDiagnostic(
                view,
                noderef.node,
                'Problem identifying primitive _. Expected _, found _.',
                'error',
                func.toString(),
                expected.toString(),
                actual.toString()
              )
            );
          } else if (error_type == 'left') {
            diagnostics.push(
              getDiagnostic(
                view,
                noderef.node,
                'Left args for _. Expected _, found _.',
                'error',
                func.toString(),
                expected.toString(),
                actual.toString()
              )
            );
          } else if (error_type == 'rightmin') {
            diagnostics.push(
              getDiagnostic(
                view,
                noderef.node,
                'Too few right args for _. Expected _, found _.',
                'error',
                func.toString(),
                expected.toString(),
                actual.toString()
              )
            );
          } else if (error_type == 'rightmax') {
            diagnostics.push(
              getDiagnostic(
                view,
                noderef.node,
                'Too many right args for _. Expected _, found _.',
                'error',
                func.toString(),
                expected.toString(),
                actual.toString()
              )
            );
          }
        }
        // Check for infinite loops
        if (args.func) {
          let funcName = getCodeName(view.state, args.func);
          var potentialLoop = false;
          // Find potentials
          if (funcName == 'while') {
            potentialLoop = args.rightArgs.length > 1 && getCodeName(view.state, args.rightArgs[0]) == 'true';
          } else if (funcName == 'loop') {
            potentialLoop = true;
          }
          // Check for loop end
          if (potentialLoop && !checkLoopEnd(view, Node))
            diagnostics.push(getDiagnostic(view, noderef.node, 'Infinite loop _', 'error', funcName));
        }
      }
    });
  return diagnostics;
};

/** checkLoopEnd: checks if a loop has a stop/die/report statement. */
const checkLoopEnd = function (view: EditorView, node: SyntaxNode) {
  let found = false;
  node.cursor().iterate((noderef) => {
    var command = getCodeName(view.state, noderef);
    if (['stop', 'die', 'report'].includes(command)) {
      found = true;
      return false;
    }
  });
  return found;
};

/** ArgsInfo: Contains all the information about the arguments of a statement. */
interface ArgsInfo {
  leftArgs: SyntaxNode | null;
  rightArgs: SyntaxNode[];
  func: SyntaxNode | null;
  hasParentheses: boolean;
}

/** getArgs: collects everything used as an argument so it can be counted. */
export const getArgs = function (Node: SyntaxNode) {
  let cursor = Node.cursor();
  let args: ArgsInfo = { leftArgs: null, rightArgs: [], func: null, hasParentheses: false };
  let seenFunc = false;
  let done = false;
  if (!cursor.firstChild()) {
    return args;
  } else if (
    Node.resolve(Node.from, -1).name == 'OpenParen' ||
    Node.resolve(Node.from, -1).resolve(Node.from, -1).name == 'OpenParen' ||
    (Node.parent?.getChildren('OpenParen').length ?? -1) > 0
  ) {
    args.hasParentheses = true;
  }
  while (done == false) {
    if (cursor.node.name == 'OpenParen') {
      args.hasParentheses = true;
      // collect nodes containing left args
    } else if (!seenFunc && cursor.node.name == 'Arg') {
      args.leftArgs = cursor.node;
    } else if (
      // collect nodes containing right args ('Commands'/'Reporters' are specifically for map, filter, etc.)
      seenFunc &&
      (cursor.node.name == 'Arg' || cursor.node.name == 'Commands' || cursor.node.name == 'Reporters')
    ) {
      args.rightArgs.push(cursor.node);
    } else if (
      // identify the node containing primitive
      (cursor.node.name.includes('Command') &&
        !cursor.node.name.includes('Commands') &&
        !cursor.node.name.includes('CommandStatement')) ||
      (cursor.node.name.includes('Reporter') &&
        !cursor.node.name.includes('Reporters') &&
        !cursor.node.name.includes('ReporterStatement'))
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

/** checkValidNumArgs: checks if correct number of arguments are present. */
export const checkValidNumArgs = function (state: EditorState, args: ArgsInfo, preprocessContext: PreprocessContext) {
  let func = getCodeName(state, args.func!);
  // checking for "-" (negation)
  if (func == '-') {
    if (!args.hasParentheses && !args.leftArgs) {
      Log('left args');
      let expected = 1;
      let actual = args.leftArgs ? 1 : 0;
      Log('left', expected, actual);
      return ['left', func, expected, actual];
    } else if (args.rightArgs.length > 1) {
      return ['rightmax', func, 1, args.rightArgs.length];
    } else {
      return [true, func, 0, 0];
    }
  }
  // checking for "Special" cases (custom and breed procedures)
  let funcRef = func;
  let name = args.func?.name ?? '';
  if (name.includes('Special')) {
    switch (name) {
      case 'SpecialCommandCreateTurtle':
        name = 'Command2Args';
        funcRef = 'create-turtles';
        break;
      case 'SpecialCommandCreateLink':
        name = 'Command2Args';
        funcRef = 'create-links-with';
        break;
      default:
        let numArgs =
          preprocessContext.Commands.get(func) ?? preprocessContext.Reporters.get(func) ?? getBreedProcedureArgs(name);
        return [numArgs == args.rightArgs.length, func, numArgs, args.rightArgs.length];
    }
  }
  // checking for regular primitives
  let primitive = primitives.GetNamedPrimitive(funcRef);
  // console.log(primitive);
  // checks for terms used as primitives but don't exist in our dataset
  if (!primitive) {
    Log('no primitive', args.func?.name, func);
    return ['no primitive', func, 0, 0];
  } else if (
    // checks for incorrect numbers of arguments on the left side
    (primitive.LeftArgumentType?.Types[0] == NetLogoType.Unit && args.leftArgs) ||
    (primitive.LeftArgumentType?.Types[0] != NetLogoType.Unit && !args.leftArgs)
  ) {
    Log('left args');
    let expected = primitive.LeftArgumentType?.Types[0] != NetLogoType.Unit ? 1 : 0;
    let actual = args.leftArgs ? 1 : 0;
    Log('left', expected, actual);
    return ['left', func, expected, actual];
  } else {
    let rightArgMin = 0;
    let rightArgMax = 0;
    if ((name.includes('APCommand') || name.includes('Var')) && !args.hasParentheses) {
      name = name.replace('Command', '');
      name = name.replace('ArgsVar', '');
      rightArgMin = Number(name[0]);
      rightArgMax = Number(name[0]);
    } else {
      // find the minimum and maximum acceptable numbers of right-side arguments
      rightArgMin = args.hasParentheses
        ? primitive.MinimumOption ??
          primitive.DefaultOption ??
          primitive.RightArgumentTypes.filter((arg) => arg.Optional == false).length
        : primitive.DefaultOption ?? primitive.RightArgumentTypes.filter((arg) => arg.Optional == false).length;
      rightArgMax =
        primitive.RightArgumentTypes.filter((arg) => arg.CanRepeat).length > 0 && args.hasParentheses
          ? 100
          : primitive.DefaultOption ?? primitive.RightArgumentTypes.length;
    }
    // ensure at least minimum # right args present
    if (args.rightArgs.length < rightArgMin) {
      Log(args.rightArgs);
      Log(func, 'rightargs', rightArgMin, rightArgMax, args.rightArgs.length);
      return ['rightmin', func, rightArgMin, args.rightArgs.length];
      // ensure at most max # right args present
    } else if (args.rightArgs.length > rightArgMax) {
      return ['rightmax', func, rightArgMax, args.rightArgs.length];
    } else {
      return [true, func, 0, 0];
    }
  }
};

// getBreedProcedureArgs: parse number of arguments for breed procedures
const getBreedProcedureArgs = function (func_type: string) {
  let match = func_type.match(/[A-Za-z]*(\d)[A-Za-z]*/);
  if (match) {
    return parseInt(match[1]);
  } else {
    return null;
  }
};
