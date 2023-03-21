import { matchBrackets, syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Localized } from '../../i18n/localized';
import { buildLinter } from './linter-builder';

// BracketLinter: Checks if all brackets have matches
export const BracketLinter = buildLinter((view, parseState) => {
  const diagnostics: Diagnostic[] = [];
  syntaxTree(view.state)
    .cursor()
    .iterate((node) => {
      let matched = false;
      let match = null;
      if (['OpenBracket', 'OpenParen'].includes(node.name)) {
        match = matchBrackets(view.state, node.from, 1);
        if (match && match.matched) {
          matched = true;
        }
      }
      if (
        !matched &&
        ((node.name == 'OpenBracket' &&
          node.node.parent?.getChildren('CloseBracket').length != 1) ||
          (node.name == 'CloseBracket' &&
            node.node.parent?.getChildren('OpenBracket').length != 1) ||
          (node.name == 'OpenParen' &&
            node.node.parent?.getChildren('CloseParen').length != 1) ||
          (node.name == 'CloseParen' &&
            node.node.parent?.getChildren('OpenParen').length != 1))
      ) {
        //console.log(matched, node.name, node.from, node.to, match);
        const value = view.state.sliceDoc(node.from, node.to);
        diagnostics.push({
          from: node.from,
          to: node.to,
          severity: 'error',
          message: Localized.Get('Unmatched item _', value),
        });
      }
    });
  return diagnostics;
});
