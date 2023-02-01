import { getIndentation, indentRange, syntaxTree } from '@codemirror/language';
import { EditorView } from 'codemirror';
import { SyntaxNode } from '@lezer/common';

export const prettify = function (view: EditorView) {
  let changes: { from: number; insert: string; to?: number }[] = [];
  let doc = view.state.doc.toString();

  //eliminate extra spacing
  let new_doc = doc.replace(/\n\s+/g, '\n');
  new_doc = new_doc.replace(/ +/g, ' ');
  // console.log(new_doc);
  view.dispatch({ changes: { from: 0, to: doc.length, insert: new_doc } });

  doc = view.state.doc.toString();
  //give certain nodes their own lines
  syntaxTree(view.state)
    .cursor()
    .iterate((node) => {
      if (
        (node.node.parent?.name == 'Program' ||
          node.name == 'To' ||
          node.name == 'End' ||
          node.name == 'Own' ||
          node.name == 'CommandStatement' ||
          (node.node.parent?.name == 'CodeBlock' &&
            node.name == 'CloseBracket')) &&
        node.from > 0
      ) {
        changes.push(getChange(node.from, doc));
      }
    });
  view.dispatch({ changes: changes });

  //ensure spacing is correct
  doc = view.state.doc.toString();
  new_doc = doc.replace(/\n\s+/g, '\n');
  console.log(new_doc.match(/\n\s+/g));
  new_doc = new_doc.replace(/(\nto[ -])/g, '\n$1');
  new_doc = new_doc.replace(/(\n[\w-]+-own)/g, '\n$1');
  view.dispatch({ changes: { from: 0, to: doc.length, insert: new_doc } });

  //add indentation
  view.dispatch({
    changes: indentRange(view.state, 0, view.state.doc.toString().length),
  });
};

const getChange = function (from: number, doc: string) {
  if (doc[from - 1] == ' ') {
    return { from: from - 1, to: from, insert: '\n' };
  } else {
    return { from: from, to: from, insert: '\n' };
  }
};
