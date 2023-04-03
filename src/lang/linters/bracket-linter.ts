import { matchBrackets, syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Localized } from '../../editor';
import { Linter } from './linter-builder';

// BracketLinter: Checks if all brackets/parentheses have matches
export const BracketLinter: Linter = (view, parseState) => {
  const diagnostics: Diagnostic[] = [];
  syntaxTree(view.state)
    .cursor()
    .iterate((node) => {
      // Match the bracket/paren
      if (['OpenBracket', 'OpenParen'].includes(node.name)) {
        let match = matchBrackets(view.state, node.from, 1);
        if (match && match.matched) return;
      }
      let current = '',
        expected = '';
      // [ need ]
      if (
        node.name == 'OpenBracket' &&
        node.node.parent?.getChildren('CloseBracket').length != 1
      ) {
        current = '[';
        expected = ']';
      }
      // ] need [
      if (
        node.name == 'CloseBracket' &&
        node.node.parent?.getChildren('OpenBracket').length != 1
      ) {
        current = ']';
        expected = '[';
      }
      // ( need )
      if (
        node.name == 'OpenParen' &&
        node.node.parent?.getChildren('CloseParen').length != 1
      ) {
        current = '(';
        expected = ')';
      }
      // ) need (
      if (
        node.name == 'OpenParen' &&
        node.node.parent?.getChildren('CloseParen').length != 1
      ) {
        current = ')';
        expected = '(';
      }
      // Push the diagnostic
      if (current != '')
        diagnostics.push({
          from: node.from,
          to: node.to,
          severity: 'error',
          message: Localized.Get('Unmatched item _', current, expected),
        });
    });
  return diagnostics;
};
