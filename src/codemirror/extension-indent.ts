import { indentService } from '@codemirror/language';

/** IndentExtension: Extension for Indentation. */
const indentExtension = indentService.of((context, pos) => {
  const previousLine = context.lineAt(pos, -1);
  const match = previousLine.text.match(/^(\s)*/);
  if (match == null) return 0;
  return match[0].length;
});

export { indentExtension };
