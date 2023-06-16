import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Linter, getDiagnostic } from './linter-builder';

/** CodeBlockLinter: Linter for code blocks. */
export const CodeBlockLinter: Linter = (view, preprocessContext, lintContext) => {
  const diagnostics: Diagnostic[] = [];
  syntaxTree(view.state)
    .cursor()
    .iterate((node) => {
      if (node.name != 'CodeBlock' && node.name != 'Embedded') return;
      let cursor = node.node.cursor();
      let isCodeBlock: boolean | null = null;
      if (!cursor.firstChild()) return;
      while (cursor.nextSibling()) {
        var name = cursor.name;
        // Use the first meaningful node to determine the type of the block.
        if (isCodeBlock == null) {
          if (!['LineComment', 'OpenBracket', 'CloseBracket'].includes(name))
            isCodeBlock = cursor.name == 'ProcedureContent';
          else continue;
        }
        if (isCodeBlock && !['LineComment', 'OpenBracket', 'CloseBracket', 'ProcedureContent'].includes(name)) {
          // For code blocks, lint non-code-block content
          // Ignore identifiers: they are already linted
          if (name !== 'Identifier')
            diagnostics.push(getDiagnostic(view, cursor, 'Invalid content for code block _', 'error'));
        } else if (!isCodeBlock && cursor.name == 'ProcedureContent') {
          // For lists, lint code-block content
          diagnostics.push(getDiagnostic(view, cursor, 'Invalid content for list _', 'error'));
        }
      }
    });
  return diagnostics;
};
