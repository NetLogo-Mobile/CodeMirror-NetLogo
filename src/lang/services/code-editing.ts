import { indentRange, syntaxTree } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { ChangeSpec } from '@codemirror/state';
import { SyntaxNode } from '@lezer/common';
import { BreedType } from '../classes/structures';

/** CodeEditing: Functions for editing code. */
export class CodeEditing {
  // #region "Common Functions"
  /** View: The editor view. */
  public View: EditorView;
  /** Constructor: Create a new code editing service. */
  public constructor(View: EditorView) {
    this.View = View;
  }
  /** InsertCode: Insert code snippets into the editor. */
  public InsertCode(Changes: ChangeSpec) {
    this.View.dispatch({ changes: Changes });
  }
  /** GetSlice: Get a slice of the code. */
  private GetSlice(From: number, To: number) {
    return this.View.state.sliceDoc(From, To);
  }
  /** FindFirstNode: Find the first node that matches a condition. */
  private FindFirstNode(
    Parent: SyntaxNode,
    Field: string,
    Condition?: (Node: SyntaxNode) => boolean
  ): SyntaxNode | null {
    for (let Child of Parent.getChildren(Field)) {
      if (Condition?.(Child) ?? true) return Child;
    }
    return null;
  }
  /** AddTermToBracket: Add a term to a bracket. */
  private AddTermToBracket(Contents: string[], Node: SyntaxNode) {
    let Existing = this.View.state.sliceDoc(Node.from, Node.to);
    console.log(Existing);
    let Seperator = Existing.includes('\n') ? '\n' : ' ';
    Node.node.getChildren('CloseBracket').map((Child) => {
      const From = Child.from;
      for (let Content of Contents) {
        this.InsertCode([
          {
            from: From,
            to: From,
            insert: Seperator + Content,
          },
          indentRange(this.View.state, From, From + 1 + Content.length),
        ]);
      }
    });
  }
  // #endregion

  // #region "Global Statements"
  /** AppendGlobals: Append items of a global statement to the editor. */
  public AppendGlobals(Field: 'global' | 'extension', Items: string[]) {
    let cursor = syntaxTree(this.View.state).cursor();
    // Find the first global statement
    if (cursor.firstChild() && cursor.firstChild()) {
      var Statement = this.FindFirstNode(cursor.node, Field);
      if (Statement) {
        this.AddTermToBracket(Items, Statement);
        return;
      }
    }
    // If not found, append a new global statement
    this.InsertCode({
      from: 0,
      to: 0,
      insert: `${Field} [ ${Items.join(' ')} ]\n`,
    });
  }
  /** AppendBreed: Append a breed to the editor. */
  public AppendBreed(Type: BreedType, Plural: string, Singular: string) {
    var Name = 'breed';
    if (Type == BreedType.DirectedLink) Name = 'directed-link-breed';
    if (Type == BreedType.UndirectedLink) Name = 'undirected-link-breed';
    this.InsertCode({
      from: 0,
      to: 0,
      insert: `${Name} [ ${Plural} ${Singular} ]\n`,
    });
  }
  /** AddBreedVariables: Add variables to a breed. */
  public AddBreedVariables(Breed: string, Variables: string[]) {
    let cursor = syntaxTree(this.View.state).cursor();
    let found = false;
    if (cursor.firstChild() && cursor.firstChild()) {
      if (cursor.node.name == 'BreedsOwn') {
        cursor.node.getChildren('Own').map((child) => {
          if (
            this.View.state.sliceDoc(child.from, child.to) ==
            Breed + '-own'
          ) {
            this.AddTermToBracket(Variables, child);
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
            if (
              this.View.state.sliceDoc(child.from, child.to) ==
              Breed + '-own'
            ) {
              this.AddTermToBracket(Variables, cursor.node);
              found = true;
            }
          });
        }
      }
      if (!found) {
        this.View.dispatch({
          changes: {
            from: cursor.node.to,
            to: cursor.node.to,
            insert: '\n' + Breed + '-own [ ' + Variables + ' ]\n',
          },
        });
      }
    }
  }
  // #endregion

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
}
