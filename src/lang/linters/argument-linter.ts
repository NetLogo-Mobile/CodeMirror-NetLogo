import { syntaxTree } from '@codemirror/language';
import { linter, Diagnostic } from '@codemirror/lint';
import { SyntaxNode } from '@lezer/common';
import { EditorState } from '@codemirror/state';
import { preprocessStateExtension } from '../../codemirror/extension-regex-state';
import { PrimitiveManager } from '../primitives/primitives';
import { NetLogoType } from '../classes';
import { Agent } from 'http';

let primitives = PrimitiveManager;

// Checks anything labelled 'Identifier'
export const ArgumentLinter = linter((view) => {
  const diagnostics: Diagnostic[] = [];
  syntaxTree(view.state)
    .cursor()
    .iterate((noderef) => {
      if (
        (noderef.name == 'Reporters' || noderef.name == 'CommandStatement') &&
        noderef.node.getChildren('Arg')
      ) {
        const Node = noderef.node;
        const value = view.state
          .sliceDoc(noderef.from, noderef.to)
          .toLowerCase();
        let args = getArgs(Node);
        if (
          Node.getChildren('VariableDeclaration').length == 0 &&
          args.func &&
          !checkValid(Node, value, view.state, args)
        ) {
          diagnostics.push({
            from: noderef.from,
            to: noderef.to,
            severity: 'error',
            message: 'Invalid number of arguments',
            actions: [
              {
                name: 'Remove',
                apply(view, from, to) {
                  view.dispatch({ changes: { from, to } });
                },
              },
            ],
          });
        }
      }
    });
  return diagnostics;
});

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
    // console.log(cursor.node.name,args)
    if (!seenFunc && cursor.node.name == 'Arg') {
      args.leftArgs = cursor.node;
    } else if (seenFunc && cursor.node.name == 'Arg') {
      args.rightArgs.push(cursor.node);
    } else if (cursor.node.name != 'LineComment') {
      // console.log(cursor.node.name)
      args.func = cursor.node;
      seenFunc = true;
    }
    if (!cursor.nextSibling()) {
      done = true;
    }
  }
  return args;
};

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
  let func = state.sliceDoc(args.func?.from, args.func?.to).toLowerCase();
  if (args.func?.name.includes('Special')) {
    let numArgs =
      state.field(preprocessStateExtension).Commands[func] ??
      state.field(preprocessStateExtension).Reporters[func] ??
      getBreedCommandArgs(func) ??
      getBreedProcedureArgs(args.func.name);
    return numArgs == args.rightArgs.length;
  } else {
    let primitive = primitives.GetPrimitive('', func);
    if (!primitive) {
      console.log('no primitive', args.func?.name, func);
      return false;
    } else if (
      (primitive.LeftArgumentType?.Types[0] == NetLogoType.Unit &&
        args.leftArgs) ||
      (primitive.LeftArgumentType?.Types[0] != NetLogoType.Unit &&
        !args.leftArgs)
    ) {
      console.log('left args');
      return false;
    } else {
      let rightArgMin =
        primitive.MinimumOption ??
        primitive.DefaultOption ??
        primitive.RightArgumentTypes.filter((arg) => arg.Optional == false)
          .length;
      let rightArgMax =
        primitive.RightArgumentTypes.filter((arg) => arg.CanRepeat).length > 0
          ? 100
          : primitive.RightArgumentTypes.length;
      if (
        args.rightArgs.length < rightArgMin ||
        args.rightArgs.length > rightArgMax
      ) {
        console.log(args.rightArgs);
        console.log(
          func,
          'rightargs',
          rightArgMin,
          rightArgMax,
          args.rightArgs.length
        );
        return false;
      } else {
        return true;
      }
    }
  }
};

const getBreedCommandArgs = function (func: string) {
  if (func.match(/^(hatch|sprout|create|create-ordered)-\w+/)) {
    return 2;
  } else if (func.match(/^create-\w+-(to|from|with)$/)) {
    return 2;
  } else {
    return null;
  }
};

const getBreedProcedureArgs = function (func_type: string) {
  let match = func_type.match(/[A-Za-z]*(\d)[A-Za-z]*/);
  if (match) {
    return parseInt(match[1]);
  } else {
    return null;
  }
};
