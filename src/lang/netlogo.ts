// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { parser } from './lang.js';

import {
  LRLanguage,
  LanguageSupport,
  delimitedIndent,
  indentNodeProp,
  foldNodeProp,
  foldInside,
  continuedIndent,
  ParseContext,
} from '@codemirror/language';
import { styleTags, tags as t } from '@lezer/highlight';
import { closeBrackets } from '@codemirror/autocomplete';
import { AutoCompletion } from './auto-completion';
import { SyntaxNode } from '@lezer/common';
import { GalapagosEditor } from '../editor';
import { preprocessStateExtension } from '../codemirror/extension-state-preprocess.js';
import { PreprocessContext } from './classes.js';

/** NetLogoLanguage: The NetLogo language. */
export const NetLogoLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      // Stylish tags
      styleTags({
        // Basic elements
        Constant: t.literal,
        String: t.literal,
        Numeric: t.literal,
        LineComment: t.lineComment,
        OpenBracket: t.paren,
        CloseBracket: t.paren,
        Directive: t.strong,
        Extension: t.bool,
        // Commands
        AndOr: t.operator,
        Reporter: t.operator,
        Reporter0Args: t.operator,
        Reporter1Args: t.operator,
        Reporter2Args: t.operator,
        Reporter3Args: t.operator,
        Reporter4Args: t.operator,
        Reporter5Args: t.operator,
        Reporter6Args: t.operator,
        Reporter0ArgsVar: t.operator,
        Reporter1ArgsVar: t.operator,
        Reporter2ArgsVar: t.operator,
        Reporter3ArgsVar: t.operator,
        Reporter4ArgsVar: t.operator,
        Reporter5ArgsVar: t.operator,
        Reporter6ArgsVar: t.operator,
        Reporter2ArgsVar0: t.operator,
        Reporter1ArgsVar0: t.operator,
        ReporterLeft1Args: t.operator,
        ReporterLeft2Args: t.operator,
        APReporter: t.operator,
        APReporterFlip: t.operator,
        APReporterVar: t.operator,
        Command: t.variableName,
        Command0Args: t.variableName,
        Command1Args: t.variableName,
        Command2Args: t.variableName,
        Command3Args: t.variableName,
        Command4Args: t.variableName,
        Command5Args: t.variableName,
        Command6Args: t.variableName,
        Command0ArgsVar: t.variableName,
        Command1ArgsVar: t.variableName,
        Command2ArgsVar: t.variableName,
        Command3ArgsVar: t.variableName,
        Command4ArgsVar: t.variableName,
        Command5ArgsVar: t.variableName,
        Command6ArgsVar: t.variableName,
        Command3ArgsVar2: t.variableName,
        APCommand: t.variableName,
        // Variables
        Set: t.variableName,
        Let: t.variableName,
        LinkVar: t.bool,
        PatchVar: t.bool,
        TurtleVar: t.bool,
        'VariableName/BreedToken': t.bool,
        // Global statements
        ExtensionStr: t.strong,
        GlobalStr: t.strong,
        'BreedDeclarative/BreedToken': t.strong,
        BreedStr: t.strong,
        Own: t.strong,
        // Procedures
        To: t.strong,
        End: t.strong,
      }),
      // Indentations
      indentNodeProp.add({
        CodeBlock: delimitedIndent({ closing: ']', align: false }),
        AnonymousProcedure: delimitedIndent({ closing: ']', align: false }),
        Extensions: delimitedIndent({ closing: ']', align: false }),
        Globals: delimitedIndent({ closing: ']', align: false }),
        Breed: delimitedIndent({ closing: ']', align: false }),
        BreedsOwn: delimitedIndent({ closing: ']', align: false }),
        Procedure: (context) =>
          /^\s*[Ee][Nn][Dd]/.test(context.textAfter)
            ? context.baseIndent
            : context.lineIndent(context.node.from) + context.unit,
        ReporterContent: continuedIndent(),
        ProcedureContent: continuedIndent(),
        // delimitedIndent({ closing: 'end' }),
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
    indentOnInput: /^\s*end$/i,
  },
});

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

/** NetLogo: The NetLogo language support. */
export function NetLogo(Editor: GalapagosEditor): LanguageSupport {
  return new LanguageSupport(NetLogoLanguage, [
    NetLogoLanguage.data.of({
      autocomplete: new AutoCompletion(Editor).GetCompletionSource(),
    }),
  ]);
}

/** EmptyContext: An empty preprocess context. */
const EmptyContext = new PreprocessContext();

/** GetContext: Get the preprocess context from the parsing context. */
export function GetContext(): PreprocessContext {
  var Context = ParseContext.get()! as any;
  if (Context == null) return EmptyContext;
  Context.Context =
    Context.Context ?? Context.state.field(preprocessStateExtension).Context;
  return Context.Context;
}
