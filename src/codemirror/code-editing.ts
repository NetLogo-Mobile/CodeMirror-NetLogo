import { indentRange, syntaxTree } from '@codemirror/language';
import { EditorView } from 'codemirror';
import { SyntaxNode } from '@lezer/common';

/** GalapagosEditing: Functions for editing code. */
// TODO: Return the changed range; Extract a common function for creating new statements if it does not exist.
export class GalapagosEditing {
  public AppendGlobal(
    view: EditorView,
    content: string,
    statement_type: string
  ) {
    let cursor = syntaxTree(view.state).cursor();
    let found = false;
    if (cursor.firstChild() && cursor.firstChild()) {
      cursor.node.getChildren(statement_type).map((child) => {
        found = true;
        this.AddTermToBracket(view, content, cursor.node);
      });
      if (!found) {
        view.dispatch({
          changes: {
            from: 0,
            to: 0,
            insert: 'globals [ ' + content + ' ]\n',
          },
        });
      }
    }
  }

  public AddBreed(
    view: EditorView,
    breed: string,
    plural: string,
    singular: string
  ) {
    view.dispatch({
      changes: {
        from: 0,
        to: 0,
        insert: breed + ' [ ' + plural + ' ' + singular + ' ]\n',
      },
    });
  }

  public AddBreedVariable(view: EditorView, breed: string, varName: string) {
    let cursor = syntaxTree(view.state).cursor();
    let found = false;
    if (cursor.firstChild() && cursor.firstChild()) {
      if (cursor.node.name == 'BreedsOwn') {
        cursor.node.getChildren('Own').map((child) => {
          if (view.state.sliceDoc(child.from, child.to) == breed + '-own') {
            this.AddTermToBracket(view, varName, child);
            found = true;
          }
        });
      }
      while (
        cursor.nextSibling() &&
        !found &&
        cursor.node.name != 'Procedure'
      ) {
        if (cursor.node.name == 'BreedsOwn') {
          cursor.node.getChildren('Own').map((child) => {
            if (view.state.sliceDoc(child.from, child.to) == breed + '-own') {
              this.AddTermToBracket(view, varName, cursor.node);
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
            insert: '\n' + breed + '-own [ ' + varName + ' ]\n',
          },
        });
      }
    }
  }

  public ReplaceProcedure(view: EditorView, name: string, content: string) {
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
  }

  public AddTermToBracket(view: EditorView, content: string, node: SyntaxNode) {
    let sep = view.state.sliceDoc(node.from, node.to).includes('\n')
      ? '\n'
      : ' ';
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
  }
}
