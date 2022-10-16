import { parser } from "./lang.js"
import { foldNodeProp, foldInside, indentNodeProp, LRLanguage, LanguageSupport, syntaxTree } from "@codemirror/language"
import { styleTags, tags as t } from "@lezer/highlight"
import { SyntaxNode } from "@lezer/common"
import { closeBrackets, completeFromList, CompletionSource, CompletionContext, CompletionResult } from "@codemirror/autocomplete"
import { directives, commands, extensions, reporters, turtleVars, patchVars, linkVars, constants, unsupported } from "./keywords"

let parserWithMetadata = parser.configure({
  props: [
    styleTags({
      Constant: t.string,
      String: t.string,
      LineComment: t.lineComment,
      "[ ]": t.paren,
      Directive: t.strong,
      Numeric: t.string,
      Extension: t.bool,
      LinkVar: t.bool,
      PatchVar: t.bool,
      TurtleVar: t.bool,
      Reporter: t.bool,
      Command: t.variableName,
      Extensions: t.strong,
      Globals: t.strong,
      Breed: t.string,
      BreedsOwn: t.string,
      Own: t.strong
    }),
    indentNodeProp.add({
      Application: context => context.column(context.node.from) + context.unit
    }),
    foldNodeProp.add({
      Application: foldInside
    })
  ]
});

export const NetLogoLanguage = LRLanguage.define({
  parser: parserWithMetadata,
  languageData: {
    commentTokens: { line: ";" },
    closeBrackets: closeBrackets()
  }
});

let keywords = [...directives, ...commands, ...reporters, ...turtleVars, ...patchVars, ...linkVars, ...constants, ...unsupported];

let keywords_list = keywords.map(function (x) {
  return { label: x, type: "keyword" };
});

let extensions_map = extensions.map(function (x) {
  return { label: x, type: "keyword" };
});

let maps = {
  "Extensions": extensions_map,
  "Globals": [],
  "BreedsOwn": [],
  'Breed': []
};

function completions(): CompletionSource {
  return (context: CompletionContext) => {
    let node = syntaxTree(context.state).resolveInner(context.pos, -1);
    let from = /\./.test(node.name) ? node.to : node.from;
    if (
      (node.parent != null && Object.keys(maps).indexOf(node.parent.type.name) > -1) ||
      (node.parent != null && node.parent.parent != null && Object.keys(maps).indexOf(node.parent.parent.type.name) > -1)
    ) {
      let map = (Object.keys(maps).indexOf(node.parent.type.name) > -1 || node.parent.parent == null) ? node.parent.type.name : node.parent.parent.type.name;
      return {
        from,
        options: maps[map]
      };
    }
    else if (node && node.type.name == 'Identifier') {
      return {
        from,
        options: keywords_list
      };
    }
    else {
      return null;
    }
  };
};

export const NetLogoCompletion = NetLogoLanguage.data.of({
  autocomplete: completions() //completeFromList(keywords_list)
});

export function NetLogo() {
  return new LanguageSupport(NetLogoLanguage, [NetLogoCompletion]);
};