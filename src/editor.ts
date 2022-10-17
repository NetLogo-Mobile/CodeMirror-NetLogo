import { EditorView, basicSetup } from "codemirror";
import { undo, redo, selectAll } from "@codemirror/commands";
import { LanguageSupport } from '@codemirror/language';
import { findNext, gotoLine, replaceNext } from "@codemirror/search";
import { Compartment, EditorState } from "@codemirror/state";
import { ViewUpdate } from "@codemirror/view";
import { NetLogo } from "./lang/netlogo.js";
import { EditorConfig, EditorLanguage } from "./editor-config";
import { highlight, highlightStyle } from "./codemirror/style-highlight";
import { indentExtension } from "./codemirror/extension-indent";
import { updateExtension } from "./codemirror/extension-update";
import { stateExtension } from "./codemirror/extension-state-netlogo";
import { lightTheme } from "./codemirror/theme-light";
import { highlightTree } from "@lezer/highlight"

/** GalapagosEditor: The editor component for NetLogo Web / Turtle Universe. */
export class GalapagosEditor {
  public readonly EditorState: EditorState;
  /** CodeMirror: The CodeMirror 6 component. */
  public readonly CodeMirror: EditorView;
  /** Options: Options of this editor. */
  public readonly Options: EditorConfig;
  /** Editable: Compartment of the EditorView. */
  private readonly Editable: Compartment;
  /** transactionFilter: Compartment of the EditorView. */
  private readonly transactionFilter: Compartment;
  /** Language: Language of the EditorView. */
  public readonly Language: LanguageSupport;

  /** Constructor: Create an editor instance. */
  constructor(Parent: HTMLElement, Options: EditorConfig) {
    this.Editable = new Compartment();
    this.Options = Options;

    // Extensions
    var Extensions = [
      // Editor
      basicSetup,
      lightTheme,
      // Readonly
      this.Editable.of(EditorView.editable.of(this.Options.ReadOnly ? false : true)),
      // Events
      
      updateExtension((Update) => this.onUpdate(Update)),
      // Language-general
      highlight,
      indentExtension,
    ];
    // Language-specific
    if (Options.Language == null || Options.Language == EditorLanguage.NetLogo) {
      Extensions.push(stateExtension);
      this.Language = NetLogo();
    }
    // Build the editor
    Extensions.push(this.Language);

    if (this.Options.OneLine) {
      Extensions.push(EditorState.transactionFilter.of(tr => tr.newDoc.lines > 1 ? [] : tr));
    }
    this.CodeMirror = new EditorView({
      extensions: Extensions,
      parent: Parent,
    });
  }

  /** Highlight: Highlight a given snippet of code. */
  Highlight(Content: string): HTMLElement {
    // Stub: Here you need to iteratively build the DOM element. The top level should be a <span></span>.
    // Ideally, using <span class="{}">{}</span> would be enough. 
    throw new Error();
  }
  // The internal method for highlighting.
  private highlightInternal(Content: string, callback: (text: string, style: string, from: number, to: number) => void, options?: Record<string, any>) {
    const tree = this.Language.language.parser.parse(Content);
    let pos = 0;
    highlightTree(tree, highlightStyle, (from, to, classes) => {
      from > pos && callback(Content.slice(pos, from), "", pos, from);
      callback(Content.slice(from, to), classes, from, to);
      pos = to;
    });
    pos != tree.length && callback(Content.slice(pos, tree.length), "", pos, tree.length);
  }

  // #region "Editor API"
  /** SetCode: Set the code of the editor. */
  SetCode(code: string) {
    this.CodeMirror.dispatch({
      changes: { from: 0, to: this.CodeMirror.state.doc.length, insert: code },
    });
  }
  /** GetCode: Get the code from the editor. */
  GetCode(): string {
    return this.CodeMirror.state.doc.toString();
  }
  /** SetReadOnly: Set the readonly status for the editor. */
  SetReadOnly(status: boolean) {
    this.CodeMirror.dispatch({
      effects: this.Editable.reconfigure(EditorView.editable.of(!status)),
    });
  }
  // #endregion

  // #region "Editor Features"
  /** Undo: Make the editor undo. Returns false if no group was available.*/
  Undo() {
    undo(this.CodeMirror);
  }
  /** Redo: Make the editor Redo. Returns false if no group was available.*/
  Redo() {
    redo(this.CodeMirror);
  }

  /** Find: Find a keyword in the editor and optionally jump to it. */
  Find(Keyword: string, JumpTo: boolean) {
  }

  /** Replace: Replace the code in the editor. */
  Replace(Source: string, Target: string) {
    // this.CodeMirror.dispatch({change: this.CodeMirror.state.replaceSelection(Source)});
  }
  /** JumpTo: Jump to a certain line. */
  JumpTo(Line: number) {
    let { state } = this.CodeMirror;
    let docLine = state.doc.line(Math.max(1, Math.min(state.doc.lines, Line)));
    this.CodeMirror.focus();
    this.CodeMirror.dispatch({ selection: { anchor: docLine.from }, scrollIntoView: true});
  }
  /** SelectAll: Select all text in the editor. */
  SelectAll() {
    selectAll(this.CodeMirror);
  }
  // #endregion

  // #region "Editor Interfaces"
  /** ShowFind: Show the finding interface. */
  // TODO: clear other interfaces
  ShowFind() {
    const searchElm = document.querySelector<HTMLElement>('.cm-search');
    searchElm ? searchElm.style.display= 'flex' : findNext(this.CodeMirror);
    const jumpElm = document.querySelector<HTMLElement>('.cm-gotoLine');
    if (jumpElm) {
      jumpElm.style.display= 'none';
    }

  }
  /** ShowReplace: Show the replace interface. */
  // TODO: clear other interfaces
  ShowReplace() {
    const searchElm = document.querySelector<HTMLElement>('.cm-search');
    searchElm ? searchElm.style.display= 'flex' : replaceNext(this.CodeMirror);
    const jumpElm = document.querySelector<HTMLElement>('.cm-gotoLine')!;
    if (jumpElm) {
      jumpElm.style.display= 'none';
    }

  }
  /** ShowJumpTo: Show the jump-to-line interface. */
  // TODO: clear other interfaces
  ShowJumpTo(Line?: number) {
    const jumpElm = document.querySelector<HTMLElement>('.cm-gotoLine');
    jumpElm ? jumpElm.style.display= 'flex' : gotoLine(this.CodeMirror);
    const searchElm = document.querySelector<HTMLElement>('.cm-search');
    if (searchElm) {
      searchElm.style.display= 'none';
    }
  }

  HideAllInterfaces(){
    const searchElm = document.querySelector<HTMLElement>('.cm-search');
    if (searchElm) {
      searchElm.style.display= 'none';
    }
    const jumpElm = document.querySelector<HTMLElement>('.cm-gotoLine')!;
    if (jumpElm) {
      jumpElm.style.display= 'none';
    }
  }
  // #endregion

  // #region "Event Handling"
  /** onUpdate: Handle the Update event. */
  private onUpdate(update: ViewUpdate) {
    if (this.Options.OnUpdate != null) 
      this.Options.OnUpdate(update.docChanged, update);
  }
  // #endregion
}

/** Export classes globally. */
try {
  (window as any).GalapagosEditor = GalapagosEditor;
} catch (error) { }
