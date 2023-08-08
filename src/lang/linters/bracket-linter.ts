import { matchBrackets, syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Localized } from '../../editor';
import { Linter, getDiagnostic } from './linter-builder';
import { getCodeName } from '../utils/code';

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
      // if(['OpenParen','CloseParen'].includes(node.name)) {
      //   let parents: string[] = [];
      //   let curr= node.node
      //   while (curr.parent) {
      //     parents.push(curr.parent.name);
      //     curr = curr.parent;
      //   }
      //   console.log(getCodeName(view.state, node),parents)
      // }
      if (['OpenBracket', 'OpenParen'].includes(node.name)) {
        let match = matchBrackets(view.state, node.from, 1);
        if (match && match.matched) return;
      }
      let current = '',
        expected = '';
      // [ need ]
      if (node.name == 'OpenBracket' && node.node.parent?.getChildren('CloseBracket').length != 1) {
        current = '[';
        expected = ']';
      }
      // ] need [
      if (node.name == 'CloseBracket' && node.node.parent?.getChildren('OpenBracket').length != 1) {
        current = ']';
        expected = '[';
      }
      // ( need )
      if (node.name == 'OpenParen' && node.node.parent?.getChildren('CloseParen').length != 1) {
        current = '(';
        expected = ')';
      }
      // ) need (
      if (node.name == 'CloseParen' && node.node.parent?.getChildren('OpenParen').length != 1) {
        current = ')';
        expected = '(';
      }
      // Push the diagnostic
      if (current != '') diagnostics.push(getDiagnostic(view, node, 'Unmatched item _', 'error', current, expected));
    });
  return diagnostics;
};
