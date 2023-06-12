import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Localized } from '../../editor';
import { Linter, getDiagnostic } from './linter-builder';

// BracketLinter: Checks if all brackets/parentheses have matches
export const CodeBlockLinter: Linter = (view, preprocessContext, lintContext) => {
  const diagnostics: Diagnostic[] = [];
  syntaxTree(view.state)
    .cursor()
    .iterate((node) => {
      if (node.name == 'CodeBlock') {
        let c = node.node.cursor();
        c.firstChild();
        if (c) {
          let type = !['LineComment', 'OpenBracket', 'CloseBracket'].includes(c.name)
            ? c.name == 'ProcedureContent'
            : null;
          while (c.nextSibling()) {
            // console.log(c.name,type)
            if (!['LineComment', 'OpenBracket', 'CloseBracket'].includes(c.name) && type == null) {
              type = c.name == 'ProcedureContent';
            }
            if (type == true && !['LineComment', 'OpenBracket', 'CloseBracket', 'ProcedureContent'].includes(c.name)) {
              diagnostics.push(
                getDiagnostic(view, c, 'Inconsistent code block type _', 'error', 'procedure content', c.name)
              );
            } else if (type == false && c.name == 'ProcedureContent') {
              diagnostics.push(
                getDiagnostic(view, c, 'Inconsistent code block type _', 'error', 'Non-procedure content', c.name)
              );
            }
          }
        }
      }
    });
  return diagnostics;
};
