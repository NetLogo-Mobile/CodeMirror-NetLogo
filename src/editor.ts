import { EditorView, basicSetup } from "codemirror"
import { ViewUpdate } from '@codemirror/view';
import { NetLogo } from "./lang/netlogo.js"
import { EditorConfig } from "./editor-config.js";
import { highlight } from "./codemirror/style-highlight";
import { indentExtension } from "./codemirror/extension-indent";
import { updateExtension } from "./codemirror/extension-update";

/** GalapagosEditor: The editor component for NetLogo Web / Turtle Universe. */
export class GalapagosEditor {
  /** CodeMirror: The CodeMirror 6 component. */
  public readonly CodeMirror: EditorView;
  /** Options: Options of this editor. */
  public readonly Options: EditorConfig;
  /** Constructor: Create an editor instance. */
  constructor(parent: HTMLElement, options: EditorConfig) {
    this.Options = options;
    this.CodeMirror = new EditorView({
      extensions: [
        basicSetup, 
        // updateExtension(this.onUpdate), 
        NetLogo(), highlight, indentExtension
      ],
      parent: parent
    });
  }

  /** Highlight: Highlight a given snippet of code. */
  // I am not sure how the API should look like. 
  // Possible inputs: string => output HTMLElement/HTML string;
  // Or input HTMLElement and replace the HTMLElement into colored HTMLElement.
  Highlight() {

  }
  
  // #region "Editor API"
  /** SetCode: Set the code of the editor. */
  SetCode(code: string) {
    this.CodeMirror.dispatch({
      changes: { from: 0, to: this.CodeMirror.state.doc.length, insert: code }
    });
  }
  /** GetCode: Get the code from the editor. */
  GetCode(): string {
    return this.CodeMirror.state.doc.toString();
  }
  /** SetReadOnly: Set the readonly status for the editor. */
  SetReadOnly(status: boolean) {
    // Stub - need implementation
  }
  // #endregion

  // #region "Editor Features"
  /** Undo: Make the editor undo. */
  Undo() {
    // Stub - need implementation
  }
  /** Redo: Make the editor Redo. */
  Redo() {
    // Stub - need implementation
  }
  /** Find: Find a keyword in the editor and optionally jump to it. */
  Find(Keyword: string, JumpTo?: boolean): number {
    // Stub - need implementation
    return -1;
  }
  /** Replace: Replace the code in the editor. */
  Replace(Source: string, Target: string): string {
    // Stub - need implementation
    return "";
  }
  /** JumpTo: Jump to a certain line. */
  JumpTo(Line?: number): boolean {
    // Stub - need implementation
    return false;
  }
  /** SelectAll: Select all text in the editor. */
	SelectAll() {
    // Stub - need implementation
  }
  // #endregion

  // #region "Editor Interfaces"
  /** ShowFind: Show the finding interface. */
  ShowFind() {
    // Stub - need implementation
  }
  /** ShowReplace: Show the replace interface. */
  ShowReplace() {
    // Stub - need implementation
  }
  /** ShowJumpTo: Show the jump-to-line interface. */
  ShowJumpTo(Line?: number) {
    // Stub - need implementation
  }
  // #endregion

  // #region "Event Handling"
  /** onUpdate: Handle the Update event. */
  private onUpdate(update: ViewUpdate) {
    if (this.Options.OnUpdate)
      this.Options.OnUpdate(update.docChanged, update);
  }
  // #endregion
}

/** Export classes globally. */
try {
  (window as any).GalapagosEditor = GalapagosEditor;
} catch (error) { }
