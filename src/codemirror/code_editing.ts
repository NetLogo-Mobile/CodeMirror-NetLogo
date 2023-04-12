import { indentRange, syntaxTree } from '@codemirror/language';
import { EditorView } from 'codemirror';
import { SyntaxNode } from '@lezer/common';

export const AppendGlobal = function (
  view: EditorView,
  content: string,
  statement_type: string
) {
  syntaxTree(view.state)
    .cursor()
    .iterate((node) => {
      if (node.name == statement_type) {
        addTerm(view, content, node.node);
      }
    });
};

export const AddBreed = function (
  view: EditorView,
  breed: string,
  plural: string,
  singular: string
) {
  view.dispatch({
    changes: {
      from: 0,
      to: 0,
      insert: breed + '[ ' + plural + ' ' + singular + ' ]\n',
    },
  });
};

export const AddBreedVar = function (
  view: EditorView,
  breed: string,
  var_name: string
) {
  let cursor = syntaxTree(view.state).cursor();
  let found = false;
  if (cursor.firstChild()) {
    if (cursor.node.name == 'BreedsOwn') {
      cursor.node.getChildren('Own').map((child) => {
        if (view.state.sliceDoc(child.from, child.to) == breed + '-own') {
          addTerm(view, var_name, child);
          found = true;
        }
      });
    }
    while (cursor.nextSibling() && !found && cursor.node.name != 'Procedure') {
      if (cursor.node.name == 'BreedsOwn') {
        cursor.node.getChildren('Own').map((child) => {
          if (view.state.sliceDoc(child.from, child.to) == breed + '-own') {
            addTerm(view, var_name, cursor.node);
            found = true;
          }
        });
      }
    }
    if (!found) {
      view.dispatch({
        changes: {
          from: cursor.node.to,
          to: cursor.node.to,
          insert: '\n' + breed + '-own [ ' + var_name + ' ]\n',
        },
      });
    }
  }
};

const addTerm = function (view: EditorView, content: string, node: SyntaxNode) {
  let sep = view.state.sliceDoc(node.from, node.to).includes('\n') ? '\n' : ' ';
  node.node.getChildren('CloseBracket').map((child) => {
    const from = child.from;
    view.dispatch({
      changes: {
        from: from,
        to: from,
        insert: sep + content,
      },
    });
    view.dispatch({
      changes: indentRange(view.state, from, from + 1 + content.length),
    });
  });
};

export const ReplaceProcedure = function (
  view: EditorView,
  name: string,
  content: string
) {
  let index = 0;
  syntaxTree(view.state)
    .cursor()
    .iterate((node) => {
      if (
        node.name == 'Procedure' &&
        view.state.sliceDoc(node.from, node.to) == name
      ) {
        index = node.from + content.length;
        view.dispatch({
          changes: {
            from: node.from,
            to: node.to,
            insert: content,
          },
        });
      }
    });
};
