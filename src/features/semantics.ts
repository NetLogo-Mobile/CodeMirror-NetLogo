import { EditorView } from '@codemirror/view';
import { GalapagosEditor } from '../editor';
import { highlightTree } from '@lezer/highlight';
import { highlightStyle } from '../codemirror/style-highlight';
import { Tree, SyntaxNodeRef } from '@lezer/common';
import { prettify, prettifyAll } from '../codemirror/prettify';
import { forEachDiagnostic, Diagnostic } from '@codemirror/lint';
import { syntaxTree } from '@codemirror/language';
import {
  BuildSnapshot,
  CodeSnapshot,
  IntegrateSnapshot,
} from '../lang/services/code-snapshot';
import { FixGeneratedCode } from '../lang/services/fix-generated-code';

/** SemanticFeatures: The linting, parsing, and highlighting features of the editor. */
export class SemanticFeatures {
  /** CodeMirror: The CodeMirror EditorView. */
  public CodeMirror: EditorView;
  /** Galapagos: The Galapagos Editor. */
  public Galapagos: GalapagosEditor;
  /** Constructor: Initialize the editing features. */
  public constructor(Galapagos: GalapagosEditor) {
    this.Galapagos = Galapagos;
    this.CodeMirror = Galapagos.CodeMirror;
  }

  // #region "Highlighting"
  /** GetSyntaxTree: Get the syntax tree of the NetLogo code. */
  GetSyntaxTree(): Tree {
    return syntaxTree(this.CodeMirror.state);
  }
  /** SyntaxNodesAt: Iterate through syntax nodes at a certain position. */
  SyntaxNodesAt(Position: number, Callback: (Node: SyntaxNodeRef) => void) {
    this.GetSyntaxTree().cursorAt(Position).iterate(Callback);
  }
  /** GetRecognizedMode: Get the recognized program mode. */
  GetRecognizedMode(): 'Unknown' | 'Model' | 'Command' | 'Reporter' {
    return this.Galapagos.GetState().RecognizedMode;
  }
  /** Highlight: Export the code in the editor into highlighted HTML. */
  Highlight(): HTMLElement {
    this.Galapagos.ForceParse();
    return this.HighlightTree(this.GetSyntaxTree(), this.Galapagos.GetCode());
  }
  /** HighlightContent: Highlight a given snippet of code. */
  HighlightContent(Content: string): HTMLElement {
    return this.HighlightTree(
      this.Galapagos.Language.language.parser.parse(Content),
      Content
    );
  }
  /** HighlightTree: Highlight a parsed syntax tree and a snippet of code. */
  HighlightTree(Tree: Tree, Content: string): HTMLElement {
    const Container = document.createElement('span');
    this.TraverseNodes(Tree, Content, (Text, Style, From, To) => {
      var Lines = Text.split('\n');
      for (var I = 0; I < Lines.length; I++) {
        var Line = Lines[I];
        var Span = document.createElement('span');
        Span.innerText = Line;
        if (Style != '') Span.className = Style;
        if (Span.innerHTML != '') Container.appendChild(Span);
        if (I != Lines.length - 1)
          Container.appendChild(document.createElement('br'));
      }
    });
    return Container;
  }
  /** TraverseNodes: Parse a snippet of code and traverse its syntax nodes. */
  private TraverseNodes(
    Tree: Tree,
    Content: string,
    Callback: (text: string, style: string, from: number, to: number) => void
  ) {
    let pos = 0;
    // Iterate over the syntax tree and call the callback for each node.
    highlightTree(Tree, highlightStyle, (from, to, classes) => {
      from > pos && Callback(Content.slice(pos, from), '', pos, from);
      Callback(Content.slice(from, to), classes, from, to);
      pos = to;
    });
    // If the last node doesn't end at the end of the content, add it.
    pos != Tree.length &&
      Callback(Content.slice(pos, Tree.length), '', pos, Tree.length);
  }
  // #endregion

  // #region "Formatting"
  /** Prettify: Prettify the selection of NetLogo code. */
  Prettify() {
    prettify(this.CodeMirror);
  }
  /** PrettifyAll: Prettify all the NetLogo code. */
  PrettifyAll() {
    this.Galapagos.ForceParse();
    prettifyAll(this.CodeMirror, this.Galapagos);
  }
  /** PrettifyOrAll: Prettify the selected code. If no code is selected, prettify all. */
  PrettifyOrAll() {
    var Ranges = this.CodeMirror.state.selection.ranges;
    if (Ranges.length == 0 || Ranges[0].from == Ranges[0].to)
      this.PrettifyAll();
    else this.Prettify();
  }
  /** BuildSnapshot: Build a snapshot of the code. */
  BuildSnapshot() {
    return BuildSnapshot(this.Galapagos);
  }
  /** IntegrateSnapshot: Integrate a snapshot of the code. */
  IntegrateSnapshot(Snapshot: CodeSnapshot) {
    return IntegrateSnapshot(this.Galapagos, Snapshot);
  }
  /** FixGeneratedCode: Try to fix and prettify a piece of generated code. */
  FixGeneratedCode(Source: string, Parent?: CodeSnapshot): string {
    return FixGeneratedCode(this.Galapagos, Source, Parent);
  }
  // #endregion

  // #region "Linting"
  /** ForEachDiagnostic: Loop through all linting diagnostics throughout the code. */
  ForEachDiagnostic(
    Callback: (d: Diagnostic, from: number, to: number) => void
  ) {
    forEachDiagnostic(this.CodeMirror.state, Callback);
  }
  // #endregion
}
