import { getIndentation, indentRange, syntaxTree } from '@codemirror/language';
import { EditorView } from 'codemirror';
import { SyntaxNode } from '@lezer/common';

export const pretty = function (view: EditorView) {
  let changes: { from: number; insert: string; to?: number }[] = [];
  let doc = view.state.doc.toString();

  //eliminate extra spacing
  let new_doc = doc.replace(/\s+/g, ' ');
  new_doc = new_doc.replace(/^\s+/, '');
  view.dispatch({ changes: { from: 0, to: doc.length, insert: new_doc } });

  //give certain nodes their own lines
  syntaxTree(view.state)
    .cursor()
    .iterate((node) => {
      if (
        (node.node.parent?.name == 'Program' ||
          node.name == 'End' ||
          node.name == 'CommandStatement') &&
        node.from > 0
      ) {
        changes.push({ from: node.from, insert: '\n' });
      }
      if ((node.name == 'To' || node.name == 'Own') && node.from > 0) {
        changes.push({ from: node.from, insert: '\n' });
      }
    });
  view.dispatch({ changes: changes });

  //add indentation
  view.dispatch({
    changes: indentRange(view.state, 0, view.state.doc.toString().length),
  });
};
