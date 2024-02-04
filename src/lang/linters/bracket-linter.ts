import { matchBrackets, syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Linter, getDiagnostic } from './linter-builder';
import { SyntaxNodeRef } from '@lezer/common';

// BracketLinter: Checks if all brackets/parentheses have matches
export const BracketLinter: Linter = (view, preprocessContext, lintContext) => {
  const diagnostics: Diagnostic[] = [];
  syntaxTree(view.state)
    .cursor()
    .iterate((node) => {
      // Match the bracket/paren
      // if (node.name=='Value'){
      //   console.log(node.node.firstChild)
      // }
      if (['OpenParen', 'CloseParen', 'OpenBracket', 'CloseBracket'].includes(node.name)) {
        let parents: string[] = [];
        let curr = node.node;
        while (curr.parent) {
          parents.push(curr.parent.name);
          curr = curr.parent;
        }
        // console.log(getCodeName(view.state, node),parents)

        if (['OpenBracket', 'OpenParen'].includes(node.name)) {
          let match = matchBrackets(view.state, node.from, 1);
          if (match && match.matched) return;
        }
        let current = '',
          expected = '';
        // [ need ]
        if (test_function(node, 'OpenBracket', 'CloseBracket')) {
          // node.name == 'OpenBracket' && node.node.parent?.getChildren('CloseBracket').length != 1) {
          // if (node.node.parent?.name=='Breed'){
          //   diagnostics.push(getDiagnostic(view, node, 'Missing breed names _', 'error','breed'))
          //   return false
          // } else{
          current = '[';
          expected = ']';
          // }
        }
        // ] need [
        else if (test_function(node, 'CloseBracket', 'OpenBracket')) {
          // if (node.name == 'CloseBracket' && node.node.parent?.getChildren('OpenBracket').length != 1) {
          current = ']';
          expected = '[';
        }
        // ( need )
        else if (test_function(node, 'OpenParen', 'CloseParen')) {
          //  if (node.name == 'OpenParen' && node.node.parent?.getChildren('CloseParen').length != 1) {
          current = '(';
          expected = ')';
        }
        // ) need (
        else if (test_function(node, 'CloseParen', 'OpenParen')) {
          // if (node.name == 'CloseParen' && node.node.parent?.getChildren('OpenParen').length != 1) {
          current = ')';
          expected = '(';
        }
        // Push the diagnostic
        // console.log(current)
        if (current != '') diagnostics.push(getDiagnostic(view, node, 'Unmatched item _', 'error', current, expected));
      }
    });
  return diagnostics;
};

const test_function = function (node: SyntaxNodeRef, name: string, match_name: string) {
  let num_paren = 1;
  if (node.node.parent?.name && ['NewVariableDeclaration', 'SetVariable'].includes(node.node.parent?.name)) {
    num_paren = 2;
  }
  return (
    node.name == name &&
    ((node.node.parent?.name != '⚠' &&
      node.node.parent?.getChildren(match_name).length != num_paren &&
      node.node.parent?.getChild('⚠')?.getChildren(match_name).length != num_paren) ||
      (node.node.parent?.name == '⚠' &&
        node.node.parent?.getChildren(match_name).length != 1 &&
        node.node.parent?.parent?.getChildren(match_name).length != 1))
  );
};
