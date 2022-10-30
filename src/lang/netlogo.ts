import { parser } from './lang.js';
import {
  foldNodeProp,
  foldInside,
  indentNodeProp,
  LRLanguage,
  LanguageSupport,
} from '@codemirror/language';
import { styleTags, tags as t } from '@lezer/highlight';
import { closeBrackets } from '@codemirror/autocomplete';
import { AutoCompletion } from './auto-completion';

const parserWithMetadata = parser.configure({
  props: [
    styleTags({
      // Basic elements
      Constant: t.string,
      String: t.string,
      LineComment: t.lineComment,
      '[ ]': t.paren,
      Directive: t.strong,
      Numeric: t.string,
      Extension: t.bool,
      LinkVar: t.bool,
      PatchVar: t.bool,
      TurtleVar: t.bool,
      Reporter: t.bool,
      Command: t.variableName,
      Set: t.variableName,
      Let: t.variableName,
      // Global statements
      Extensions: t.strong,
      Globals: t.strong,
      Breed: t.strong,
      BreedsOwn: t.strong,
      Own: t.strong,
      // Procedures
      To: t.strong,
      End: t.strong,
    }),
    indentNodeProp.add({
      Application: (context) =>
        context.column(context.node.from) + context.unit,
    }),
    foldNodeProp.add({
      Application: foldInside,
    }),
  ],
});

/** NetLogoLanguage: The NetLogo language. */
export const NetLogoLanguage = LRLanguage.define({
  parser: parserWithMetadata,
  languageData: {
    commentTokens: { line: ';' },
    closeBrackets: closeBrackets(),
  },
});

/** NetLogo: The NetLogo language support. */
export function NetLogo(): LanguageSupport {
  return new LanguageSupport(NetLogoLanguage, [
    NetLogoLanguage.data.of({
      autocomplete: new AutoCompletion().GetCompletionSource(),
    }),
  ]);
}
