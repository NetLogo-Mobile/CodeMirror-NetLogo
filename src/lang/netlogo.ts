// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { parser } from './lang.js';

import {
  LRLanguage,
  LanguageSupport,
  delimitedIndent,
  flatIndent,
  continuedIndent,
  indentNodeProp,
  foldNodeProp,
  foldInside,
  syntaxTree,
} from '@codemirror/language';
import { styleTags, tags as t } from '@lezer/highlight';
import { closeBrackets } from '@codemirror/autocomplete';
import { AutoCompletion } from './auto-completion';
import { SyntaxNode } from '@lezer/common';

/** NetLogoLanguage: The NetLogo language. */
export const NetLogoLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      // Stylish tags
      styleTags({
        // Basic elements
        Constant: t.string,
        String: t.string,
        LineComment: t.lineComment,
        '[ ]': t.paren,
        BreedDirective: t.strong,
        Directive: t.strong,
        Numeric: t.string,
        Extension: t.bool,
        LinkVar: t.bool,
        PatchVar: t.bool,
        TurtleVar: t.bool,
        Reporter: t.bool,
        Reporter0Args: t.bool,
        Reporter1Args: t.bool,
        Reporter2Args: t.bool,
        Reporter3Args: t.bool,
        Reporter4Args: t.bool,
        Command: t.variableName,
        Command0Args: t.variableName,
        Command1Args: t.variableName,
        Command2Args: t.variableName,
        Command3Args: t.variableName,
        Command4Args: t.variableName,
        Set: t.variableName,
        Let: t.variableName,
        // Global statements
        ExtensionStr: t.strong,
        GlobalStr: t.strong,
        BreedStr: t.strong,
        Own: t.strong,
        // Procedures
        To: t.strong,
        End: t.strong,
      }),
      // Indentations
      indentNodeProp.add({
        CodeBlock: delimitedIndent({ closing: '[' }),
        Procedure: delimitedIndent({ closing: 'end' }),
        // Doesn't work well with "END" or "eND". Should do a bug report to CM6.
      }),
      // Foldings
      foldNodeProp.add({
        CodeBlock: foldInside,
        Procedure: foldProcedure,
      }),
    ],
  }),
  languageData: {
    commentTokens: { line: ';' },
    closeBrackets: closeBrackets(),
    indentOnInput: /^\s*(?:end|\]|\])$/i,
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

/// [Fold](#language.foldNodeProp) function that folds everything but
/// the first and the last child of a syntax node. Useful for nodes
/// that start and end with delimiters.
function foldProcedure(node: SyntaxNode): { from: number; to: number } | null {
  var first = node.getChild('Arguments');
  first = first ?? node.getChild('ProcedureName');
  first = first ?? node.firstChild;
  let last = node.lastChild;
  return first && first.to < last!.from
    ? { from: first.to, to: last!.type.isError ? node.to : last!.to }
    : null;
}
