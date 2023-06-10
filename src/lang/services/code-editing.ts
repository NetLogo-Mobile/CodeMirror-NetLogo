import { indentRange, syntaxTree } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { ChangeSpec } from '@codemirror/state';
import { SyntaxNode } from '@lezer/common';
import { BreedType } from '../classes/structures';
import { GetCursorInsideMode, GetCursorUntilMode } from '../utils/cursors';
import { GalapagosEditor } from '../../editor';
import { preprocessStateExtension } from '../../codemirror/extension-state-preprocess';
import { getSingularName } from '../../utils/breed-utils';
import { reserved } from '../keywords';

/** CodeEditing: Functions for editing code. */
export class CodeEditing {
  // #region "Common Functions"
  /** View: The editor view. */
  public View: EditorView;
  /** Galapagos: The editor instance. */
  public Galapagos: GalapagosEditor;
  /** Constructor: Create a new code editing service. */
  public constructor(View: EditorView) {
    this.View = View;
    this.Galapagos = View.state.field(preprocessStateExtension).Editor!;
  }
  /** ChangeCode: Send a changeset into the editor. */
  public ChangeCode(Changes: ChangeSpec) {
    this.View.dispatch({ changes: Changes });
  }
  /** GetSlice: Get a slice of the code. */
  private GetSlice(From: number, To: number) {
    return this.View.state.sliceDoc(From, To);
  }
  /** FindFirstChild: Find the first child that matches a condition. */
  private FindFirstChild(
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
  private AddTermToBracket(Contents: string[], Node: SyntaxNode): boolean {
    // De-duplicate the contents
    var Identifiers = Node.node.getChildren('Identifier').map((Child) => this.GetSlice(Child.from, Child.to).trim());
    Contents = Contents.filter((Content) => Identifiers.indexOf(Content) == -1);
    if (Contents.length == 0) return false;
    // Find the spaces between the brackets
    let Seperator = this.View.state.sliceDoc(Node.from, Node.to).includes('\n') ? '\n' : ' ';
    var From = this.FindFirstChild(Node, 'CloseBracket')!.from;
    // Insert the contents
    for (let Content of Contents.reverse()) {
      this.ChangeCode({
        from: From,
        to: From,
        insert: Content + Seperator,
      });
      this.ChangeCode(indentRange(this.View.state, From, From + 1 + Content.length));
    }
    return true;
  }
  // #endregion

  // #region "Global Statements"
  /** AppendGlobals: Append items of a global statement to the editor. */
  public AppendGlobals(Field: 'Globals' | 'Extensions', Items: string[]): boolean {
    Items = [...new Set(Items.filter((Item) => reserved.indexOf(Item) == -1))];
    if (Items.length == 0) return false;
    // Find the cursor
    let Cursor = GetCursorUntilMode(this.View.state);
    // Find the first global statement
    if (Cursor) {
      var Statement = this.FindFirstChild(Cursor.node, Field);
      if (Statement) return this.AddTermToBracket(Items, Statement);
    }
    // If not found, append a new global statement
    this.ChangeCode({
      from: 0,
      to: 0,
      insert: `${Field.toLowerCase()} [ ${Items.join(' ')} ]\n`,
    });
    return true;
  }
  /** AppendBreed: Append a breed to the editor. */
  public AppendBreed(Type: BreedType, Plural: string, Singular: string): boolean {
    // Check if the breed already exists
    if (Plural == 'patches' || Singular == 'patch') return false;
    if (Plural == Singular) Singular = getSingularName(Plural);
    for (let [Sin, Breed] of this.Galapagos.LintContext.Breeds) {
      if (Breed.Plural == Plural || Breed.Singular == Singular || Breed.Singular == Plural || Breed.Plural == Singular)
        return false;
    }
    // TODO: Find the most appropriate place to insert the breed
    // Add the breed
    var Name = 'breed';
    if (Type == BreedType.DirectedLink) Name = 'directed-link-breed';
    if (Type == BreedType.UndirectedLink) Name = 'undirected-link-breed';
    this.ChangeCode({
      from: 0,
      to: 0,
      insert: `${Name} [ ${Plural} ${Singular} ]\n`,
    });
    return true;
  }
  /** AppendBreedVariables: Add variables to a breed. */
  public AppendBreedVariables(Plural: string, Variables: string[]): boolean {
    Variables = [...new Set(Variables.filter((Item) => reserved.indexOf(Item) == -1))];
    if (Variables.length == 0) return false;
    let Cursor = GetCursorInsideMode(this.View.state);
    // Find the first existing statement
    if (Cursor) {
      while (true) {
        if (Cursor.node.name == 'BreedsOwn') {
          var Own = this.FindFirstChild(Cursor.node, 'Own')!;
          var Name = this.GetSlice(Own.from, Own.to).trim().toLowerCase();
          if (Name === Plural.toLowerCase() + '-own') {
            this.AddTermToBracket(Variables, Cursor.node);
            return true;
          }
        }
        if (!Cursor.nextSibling() || Cursor.node.name === 'Procedure') break;
      }
    }
    // TODO: Find the most appropriate place to insert the breed
    // If not found, append a new statement
    this.ChangeCode({
      from: 0,
      to: 0,
      insert: `${Plural.toLowerCase()}-own [ ${Variables.join(' ')} ]\n`,
    });
    return true;
  }
  // #endregion

  public ReplaceProcedure(view: EditorView, name: string, content: string) {
    let index = 0;
    syntaxTree(view.state)
      .cursor()
      .iterate((node) => {
        if (node.name == 'Procedure' && view.state.sliceDoc(node.from, node.to) == name) {
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
