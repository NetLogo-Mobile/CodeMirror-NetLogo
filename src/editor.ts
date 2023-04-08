import { EditorView, basicSetup } from 'codemirror';
import { undo, redo, selectAll, indentWithTab } from '@codemirror/commands';
import { closeCompletion, acceptCompletion } from '@codemirror/autocomplete';
import {
  forceParsing,
  LanguageSupport,
  syntaxTree,
} from '@codemirror/language';
import {
  replaceAll,
  selectMatches,
  SearchQuery,
  findNext,
  gotoLine,
  replaceNext,
  setSearchQuery,
  openSearchPanel,
  closeSearchPanel,
} from '@codemirror/search';
import { Prec, Compartment, EditorState, Extension } from '@codemirror/state';
import { ViewUpdate, keymap } from '@codemirror/view';
import { NetLogo } from './lang/netlogo.js';
import { EditorConfig, EditorLanguage, ParseMode } from './editor-config';
import { highlight, highlightStyle } from './codemirror/style-highlight';
import { updateExtension } from './codemirror/extension-update';
import {
  stateExtension,
  StateNetLogo,
} from './codemirror/extension-state-netlogo';
import {
  preprocessStateExtension,
  StatePreprocess,
} from './codemirror/extension-state-preprocess.js';
import { tooltipExtension } from './codemirror/extension-tooltip';
import { lightTheme } from './codemirror/theme-light';
import { highlightTree } from '@lezer/highlight';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { netlogoLinters } from './lang/linters/linters';
import { RuntimeError } from './lang/linters/runtime-linter.js';
import { Dictionary } from './i18n/dictionary.js';
import { prettify, prettifyAll } from './codemirror/prettify.js';
import { forEachDiagnostic, Diagnostic } from '@codemirror/lint';
import { LocalizationManager } from './i18n/localized.js';
import { Tree, SyntaxNodeRef } from '@lezer/common';
import { buildLinter } from './lang/linters/linter-builder.js';
import { PreprocessContext, LintContext } from './lang/classes.js';
import { globalStateExtension } from './codemirror/extension-global-state.js';

/** GalapagosEditor: The editor component for NetLogo Web / Turtle Universe. */
export class GalapagosEditor {
  public readonly EditorState!: EditorState;
  /** CodeMirror: The CodeMirror 6 component. */
  public readonly CodeMirror: EditorView;
  /** Options: Options of this editor. */
  public readonly Options: EditorConfig;
  /** Editable: Compartment of the EditorView. */
  private readonly Editable: Compartment;
  /** Language: Language of the EditorView. */
  public readonly Language: LanguageSupport;
  /** Parent: Parent HTMLElement of the EditorView. */
  public readonly Parent: HTMLElement;
  /** Linters: The linters used in this instance. */
  public readonly Linters: Extension[] = [];
  /** Children: The connected editors. */
  public Children: GalapagosEditor[] = [];
  /** isParent: Whether the editor is the parent editor. */
  public isParent: Boolean = false;
  /** PreprocessContext: the combined preprocessed context of the parent editor. */
  public PreprocessContext: PreprocessContext = new PreprocessContext();
  /** LintContext: the combined statenetlogo context of the parent editor. */
  public LintContext: LintContext = new LintContext();
  public ParentEditor: GalapagosEditor | null = null;

  /** Constructor: Create an editor instance. */
  constructor(Parent: HTMLElement, Options: EditorConfig) {
    this.Editable = new Compartment();
    this.Parent = Parent;
    this.Options = Options;

    // Extensions
    const Extensions = [
      // Editor
      basicSetup,
      lightTheme,
      // Readonly
      this.Editable.of(EditorView.editable.of(!this.Options.ReadOnly)),
      // Events
      updateExtension((Update) => this.onUpdate(Update)),
      highlight,
      // indentExtension
      keymap.of([indentWithTab]),
    ];

    // Language-specific
    switch (Options.Language) {
      case EditorLanguage.Javascript:
        this.Language = javascript();
        break;
      case EditorLanguage.CSS:
        this.Language = css();
        break;
      case EditorLanguage.HTML:
        this.Language = html();
        break;
      default:
        this.Language = NetLogo();
        Extensions.push(preprocessStateExtension);
        Extensions.push(stateExtension);
        Extensions.push(globalStateExtension);
        Dictionary.ClickHandler = Options.OnDictionaryClick;
        this.Linters = netlogoLinters.map((linter) =>
          buildLinter(linter, this)
        );
        // Special case: One-line mode
        if (!this.Options.OneLine) {
          Extensions.push(tooltipExtension);
        } else {
          Extensions.unshift(
            Prec.highest(keymap.of([{ key: 'Enter', run: () => true }]))
          );
          Extensions.unshift(
            Prec.highest(keymap.of([{ key: 'Tab', run: acceptCompletion }]))
          );
        }
        Extensions.push(...this.Linters);
    }
    Extensions.push(this.Language);

    // DOM handlers
    Extensions.push(
      EditorView.domEventHandlers({
        keydown: Options.OnKeyDown,
        keyup: Options.OnKeyUp,
      })
    );

    // One-line mode
    if (this.Options.OneLine) {
      Extensions.push(
        EditorState.transactionFilter.of((tr) =>
          tr.newDoc.lines > 1 ? [] : tr
        )
      );
    }

    // Wrapping mode
    if (this.Options.Wrapping) {
      Extensions.push(EditorView.lineWrapping);
    }

    // Build the editor
    this.CodeMirror = new EditorView({
      extensions: Extensions,
      parent: Parent,
    });
    this.GetState().Mode = this.Options.ParseMode ?? ParseMode.Normal;

    // Disable Grammarly
    const el = this.Parent.getElementsByClassName('cm-content')[0];
    el.setAttribute('data-enable-grammarly', 'false');
  }

  // #region "Highlighting & Linting"
  /** Highlight: Highlight a given snippet of code. */
  Highlight(Content: string): HTMLElement {
    var LastPosition = 0;
    const Container = document.createElement('span');
    this.highlightInternal(Content, (Text, Style, From, To) => {
      if (Style == '') {
        var Lines = Text.split('\n');
        for (var I = 0; I < Lines.length; I++) {
          var Line = Lines[I];
          var Span = document.createElement('span');
          Span.innerText = Line;
          Span.innerHTML = Span.innerHTML.replace(/ /g, '&nbsp;');
          Container.appendChild(Span);
          if (I != Lines.length - 1)
            Container.appendChild(document.createElement('br'));
        }
      } else {
        const Node = document.createElement('span');
        Node.innerText = Text;
        Node.innerHTML = Node.innerHTML.replace(' ', '&nbsp;');
        Node.className = Style;
        Container.appendChild(Node);
      }
      LastPosition = To;
    });
    return Container;
  }

  // The internal method for highlighting.
  private highlightInternal(
    Content: string,
    callback: (text: string, style: string, from: number, to: number) => void,
    options?: Record<string, any>
  ) {
    const tree = this.Language.language.parser.parse(Content);
    let pos = 0;
    highlightTree(tree, highlightStyle, (from, to, classes) => {
      from > pos && callback(Content.slice(pos, from), '', pos, from);
      callback(Content.slice(from, to), classes, from, to);
      pos = to;
    });
    pos != tree.length &&
      callback(Content.slice(pos, tree.length), '', pos, tree.length);
  }
  // #endregion

  // #region "Editor Statuses"
  /** GetState: Get the current parser state of the NetLogo code. */
  GetState(): StateNetLogo {
    return this.CodeMirror.state
      .field(stateExtension)
      .ParseState(this.CodeMirror.state);
  }

  /** GetPreprocessState: Get the preprocess parser state of the NetLogo code. */
  GetPreprocessState(): StatePreprocess {
    return this.CodeMirror.state.field(preprocessStateExtension);
  }

  /** GetSyntaxTree: Get the syntax tree of the NetLogo code. */
  GetSyntaxTree(): Tree {
    return syntaxTree(this.CodeMirror.state);
  }

  /** SyntaxNodesAt: Iterate through syntax nodes at a certain position. */
  SyntaxNodesAt(Position: number, Callback: (Node: SyntaxNodeRef) => void) {
    this.GetSyntaxTree().cursorAt(Position).iterate(Callback);
  }

  /** GetRecognizedMode: Get the recognized program mode. */
  GetRecognizedMode(): string {
    var Name = this.GetSyntaxTree().topNode?.firstChild?.name;
    switch (Name) {
      case 'Embedded':
        return 'Command';
      case 'OnelineReporter':
        return 'Reporter';
      case 'Normal':
        return 'Model';
      default:
        return 'Unknown';
    }
  }
  // #endregion

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

  /** AddEditor: Add an editor. */
  AddEditor(editor: GalapagosEditor) {
    console.log('adding editor', editor);
    this.Children.push(editor);
    this.isParent = true;
  }

  /** AddParent: Add a parent editor. */
  AddParent(editor: GalapagosEditor) {
    console.log('adding parent', editor);
    this.ParentEditor = editor;
  }

  /** SetCursorPosition: Set the cursor position of the editor. */
  SetCursorPosition(position: number) {
    this.CodeMirror.dispatch({
      selection: { anchor: position },
      scrollIntoView: true,
    });
  }

  /** Blur: Make the editor lose the focus (if any). */
  Blur() {
    this.CodeMirror.contentDOM.blur();
  }

  /** Focus: Make the editor gain the focus (if possible). */
  Focus() {
    this.CodeMirror.focus();
  }

  /** Prettify: Prettify the selection ofNetLogo code. */
  Prettify() {
    prettify(this.CodeMirror);
  }

  /** PrettifyAll: Prettify all the NetLogo code. */
  PrettifyAll() {
    this.ForceParse();
    prettifyAll(this.CodeMirror);
  }

  /** CloseCompletion: Forcible close the auto completion. */
  CloseCompletion() {
    closeCompletion(this.CodeMirror);
  }

  /** SetWidgetVariables: Sync the widget-defined global variables to the syntax parser/linter. */
  SetWidgetVariables(Variables: string[], ForceLint?: boolean) {
    var State = this.GetState();
    var Current = State.WidgetGlobals;
    var Changed = Current.length != Variables.length;
    if (!Changed) {
      for (var I = 0; I < Variables.length; I++) {
        if (Current[I] != Variables[I]) {
          Changed = true;
          break;
        }
      }
    }
    if (Changed) {
      State.WidgetGlobals = Variables.map((str) => str.toLowerCase());
      State.IncVersion();
      if (ForceLint) this.ForceLint();
    }
  }

  /** SetMode: Set the parsing mode of the editor. */
  SetMode(Mode: ParseMode, ForceLint?: boolean) {
    var State = this.GetState();
    var Current = State.Mode;
    if (Current != Mode) {
      State.Mode = Mode;
      State.IncVersion();
      if (ForceLint) this.ForceLint();
    }
  }

  /** SetCompilerErrors: Sync the compiler errors and present it on the editor. */
  // TODO: Some errors come with start 2147483647, which needs to be rendered as a tip without position.
  SetCompilerErrors(Errors: RuntimeError[]) {
    this.GetState().CompilerErrors = Errors;
    this.GetState().RuntimeErrors = [];
    this.ForceLint();
  }

  /** SetCompilerErrors: Sync the runtime errors and present it on the editor. */
  SetRuntimeErrors(Errors: RuntimeError[]) {
    this.GetState().RuntimeErrors = Errors;
    this.ForceLint();
  }
  // #endregion

  //#region "SharedContext"
  /** UpdateSharedContext: Get the shared context of the editor. */
  UpdateSharedContext() {
    //if (this.isParent){
    this.PreprocessContext = new PreprocessContext();
    this.LintContext = new LintContext();
    let index = 0;
    for (var child of [...this.Children, this]) {
      if (child.Options.ParseMode == ParseMode.Normal) {
        let preprocess = child.CodeMirror.state.field(preprocessStateExtension);
        let statenetlogo = child.CodeMirror.state.field(stateExtension);
        //console.log(statenetlogo)
        for (var p of preprocess.PluralBreeds) {
          this.PreprocessContext.PluralBreeds.set(p, index);
        }
        for (var p of preprocess.SingularBreeds) {
          this.PreprocessContext.SingularBreeds.set(p, index);
        }
        for (var p of preprocess.BreedVars) {
          this.PreprocessContext.BreedVars.set(p, index);
        }
        for (var p of Object.keys(preprocess.Commands)) {
          let numArgs = preprocess.Commands[p];
          if (numArgs) {
            this.PreprocessContext.Commands[p] = numArgs;
            this.PreprocessContext.CommandsOrigin[p] = index;
          }
        }
        for (var p of Object.keys(preprocess.Reporters)) {
          let numArgs = preprocess.Reporters[p];
          if (numArgs) {
            this.PreprocessContext.Reporters[p] = numArgs;
            this.PreprocessContext.ReportersOrigin[p] = index;
          }
        }
        for (var p of statenetlogo.Extensions) {
          this.LintContext.Extensions.set(p, index);
        }
        for (var p of statenetlogo.Globals) {
          this.LintContext.Globals.set(p, index);
        }
        for (var p of statenetlogo.WidgetGlobals) {
          this.LintContext.WidgetGlobals.set(p, index);
        }
        for (var p of statenetlogo.Procedures.keys()) {
          let copy = statenetlogo.Procedures.get(p);
          if (copy) {
            copy.EditorId = index;
            this.LintContext.Procedures.set(p, copy);
          }
        }
        for (var p of statenetlogo.Breeds.keys()) {
          let copy = statenetlogo.Breeds.get(p);
          if (copy) {
            copy.EditorId = index;
            this.LintContext.Breeds.set(p, copy);
          }
        }
      }
      index++;
    }
    //console.log("SETTING MASTER")
    this.CodeMirror.state
      .field(globalStateExtension)
      .SetLintContext(this.LintContext);
    this.CodeMirror.state
      .field(globalStateExtension)
      .SetPreprocessContext(this.PreprocessContext);
    //console.log(this.PreprocessContext,this.LintContext)
    for (var child of this.Children) {
      //console.log("old",child.LintContext,child.PreprocessContext)
      console.log('Setting child');
      child.SetLintContext(this.LintContext);
      child.SetPreprocessContext(this.PreprocessContext);
      //console.log("new",child.LintContext,child.PreprocessContext)
    }
    //}
  }
  SetLintContext(lint: LintContext) {
    //console.log("old child",this.LintContext)
    this.LintContext = lint;
    this.CodeMirror.state
      .field(globalStateExtension)
      .SetLintContext(this.LintContext, true);
    this.GetState().IncVersion();
    //console.log("new child",this.LintContext)
  }
  SetPreprocessContext(preprocess: PreprocessContext) {
    this.PreprocessContext = preprocess;
    this.CodeMirror.state
      .field(globalStateExtension)
      .SetPreprocessContext(this.PreprocessContext, true);
    this.GetState().IncVersion();
  }
  // #endregion

  // #region "Diagnostics"
  /** ForEachDiagnostic: Loop through all linting diagnostics throughout the code. */
  ForEachDiagnostic(
    Callback: (d: Diagnostic, from: number, to: number) => void
  ) {
    forEachDiagnostic(this.CodeMirror.state, Callback);
  }

  /** ForceLintAsync: Force the editor to lint without rendering. */
  async ForceLintAsync(): Promise<Diagnostic[]> {
    var Diagnostics = [];
    for (var Extension of this.Linters) {
      var Results = await Promise.resolve(
        (Extension as any).Source(this.CodeMirror)
      );
      Diagnostics.push(...Results);
    }
    return Diagnostics;
  }

  /** ForceParse: Force the editor to finish any parsing. */
  ForceParse() {
    forceParsing(this.CodeMirror, this.CodeMirror.state.doc.length, 100000);
    this.CodeMirror.state.field(stateExtension).SetDirty();
  }

  /** ForceLint: Force the editor to do another round of linting. */
  ForceLint() {
    const plugins: any[] = (this.CodeMirror as any).plugins;
    for (var I = 0; I < plugins.length; I++) {
      if (plugins[I].value.hasOwnProperty('lintTime')) {
        plugins[I].value.set = true;
        plugins[I].value.force();
        break;
      }
    }
  }
  // #endregion

  // #region "Editor Features"
  /** Undo: Make the editor undo. Returns false if no group was available. */
  Undo() {
    undo(this.CodeMirror);
  }

  /** Redo: Make the editor Redo. Returns false if no group was available. */
  Redo() {
    redo(this.CodeMirror);
  }

  /** ClearHistory: Clear the change history. */
  ClearHistory() {
    // Stub!
  }

  /** Find: Find a keyword in the editor and loop over all matches. */
  Find(Keyword: string) {
    openSearchPanel(this.CodeMirror);
    let prevValue = (<HTMLInputElement>(
      this.Parent.querySelector<HTMLElement>('.cm-textfield[name="search"]')
    ))?.value;
    this.CodeMirror.dispatch({
      effects: setSearchQuery.of(
        new SearchQuery({
          search: Keyword,
        })
      ),
    });
    findNext(this.CodeMirror);
    if (!prevValue) prevValue = '';
    this.CodeMirror.dispatch({
      effects: setSearchQuery.of(
        new SearchQuery({
          search: prevValue,
        })
      ),
    });
    closeSearchPanel(this.CodeMirror);
  }

  /** Replace: Loop through the matches and replace one at a time. */
  Replace(Source: string, Target: string) {
    openSearchPanel(this.CodeMirror);
    let prevFind = (<HTMLInputElement>(
      this.Parent.querySelector<HTMLElement>('.cm-textfield[name="search"]')
    ))?.value;
    let prevReplace = (<HTMLInputElement>(
      this.Parent.querySelector<HTMLElement>('.cm-textfield[name="replace"]')
    ))?.value;
    this.CodeMirror.dispatch({
      effects: setSearchQuery.of(
        new SearchQuery({
          search: Source,
          replace: Target,
        })
      ),
    });
    replaceNext(this.CodeMirror);
    if (!prevFind) prevFind = '';
    if (!prevReplace) prevReplace = '';
    findNext(this.CodeMirror);
    this.CodeMirror.dispatch({
      effects: setSearchQuery.of(
        new SearchQuery({
          search: prevFind,
          replace: prevReplace,
        })
      ),
    });
    closeSearchPanel(this.CodeMirror);
  }

  /** FindAll: Find all the matching words in the editor. */
  FindAll(Source: string) {
    openSearchPanel(this.CodeMirror);
    let prevValue = (<HTMLInputElement>(
      this.Parent.querySelector<HTMLElement>('.cm-textfield[name="search"]')
    ))?.value;
    this.CodeMirror.dispatch({
      effects: setSearchQuery.of(
        new SearchQuery({
          search: Source,
        })
      ),
    });
    selectMatches(this.CodeMirror);
    if (!prevValue) prevValue = '';
    this.CodeMirror.dispatch({
      effects: setSearchQuery.of(
        new SearchQuery({
          search: prevValue,
        })
      ),
    });
    closeSearchPanel(this.CodeMirror);
  }

  /** ReplaceAll: Replace the all the matching words in the editor. */
  ReplaceAll(Source: string, Target: string) {
    openSearchPanel(this.CodeMirror);
    let prevFind = (<HTMLInputElement>(
      this.Parent.querySelector<HTMLElement>('.cm-textfield[name="search"]')
    ))?.value;
    let prevReplace = (<HTMLInputElement>(
      this.Parent.querySelector<HTMLElement>('.cm-textfield[name="replace"]')
    ))?.value;
    this.CodeMirror.dispatch({
      effects: setSearchQuery.of(
        new SearchQuery({
          search: Source,
          replace: Target,
        })
      ),
    });
    replaceAll(this.CodeMirror);
    if (!prevFind) prevFind = '';
    if (!prevReplace) prevReplace = '';
    this.CodeMirror.dispatch({
      effects: setSearchQuery.of(
        new SearchQuery({
          search: prevFind,
          replace: prevReplace,
        })
      ),
    });
    closeSearchPanel(this.CodeMirror);
  }

  /** JumpTo: Jump to a certain line. */
  JumpTo(Line: number) {
    const { state } = this.CodeMirror;
    const docLine = state.doc.line(
      Math.max(1, Math.min(state.doc.lines, Line))
    );
    this.CodeMirror.dispatch({
      selection: { anchor: docLine.from },
      scrollIntoView: true,
    });
  }

  /** SelectAll: Select all text in the editor. */
  SelectAll() {
    selectAll(this.CodeMirror);
  }

  /** Select: Select and scroll to a given range in the editor. */
  Select(Start: number, End: number) {
    if (End > this.CodeMirror.state.doc.length || Start < 0 || Start > End) {
      return;
    }
    this.CodeMirror.dispatch({
      selection: { anchor: Start, head: End },
      scrollIntoView: true,
    });
  }

  /** GetSelection: Returns an object of the start and end of
   *  a selection in the editor. */
  GetSelection() {
    return {
      from: this.CodeMirror.state.selection.main.from,
      to: this.CodeMirror.state.selection.main.to,
    };
  }

  /** GetSelectionCode: Returns the selected code in the editor. */
  GetSelectionCode() {
    return this.CodeMirror.state.sliceDoc(
      this.CodeMirror.state.selection.main.from,
      this.CodeMirror.state.selection.main.to
    );
  }
  // #endregion

  // #region "Editor Interfaces"
  /** ShowFind: Show the finding interface. */
  ShowFind() {
    this.HideAllInterfaces();
    openSearchPanel(this.CodeMirror);
    // hide inputs related to replace for find interface
    const input = this.Parent.querySelector<HTMLElement>(
      '.cm-textfield[name="replace"]'
    );
    if (input) input.style.display = 'none';
    const button1 = this.Parent.querySelector<HTMLElement>(
      '.cm-button[name="replace"]'
    );
    if (button1) button1.style.display = 'none';
    const button2 = this.Parent.querySelector<HTMLElement>(
      '.cm-button[name="replaceAll"]'
    );
    if (button2) button2.style.display = 'none';
  }

  /** ShowReplace: Show the replace interface. */
  ShowReplace() {
    this.HideAllInterfaces();
    openSearchPanel(this.CodeMirror);
    // show inputs related to replace
    const input = this.Parent.querySelector<HTMLElement>(
      '.cm-textfield[name="replace"]'
    );
    if (input) input.style.display = 'inline-block';
    const button1 = this.Parent.querySelector<HTMLElement>(
      '.cm-button[name="replace"]'
    );
    if (button1) button1.style.display = 'inline-block';
    const button2 = this.Parent.querySelector<HTMLElement>(
      '.cm-button[name="replaceAll"]'
    );
    if (button2) button2.style.display = 'inline-block';
  }

  /** ShowJumpTo: Show the jump-to-line interface. */
  ShowJumpTo() {
    closeSearchPanel(this.CodeMirror);
    const jumpElm = this.Parent.querySelector<HTMLElement>('.cm-gotoLine');
    jumpElm ? (jumpElm.style.display = 'flex') : gotoLine(this.CodeMirror);
  }

  /** HideJumpTo: Hide line interface. */
  HideJumpTo() {
    const jumpElm = this.Parent.querySelector<HTMLElement>('.cm-gotoLine');
    if (jumpElm) jumpElm.style.display = 'none';
  }

  /** HideAllInterfaces: Hide all interfaces available. */
  HideAllInterfaces() {
    closeSearchPanel(this.CodeMirror);
    this.HideJumpTo();
  }

  /** ShowProcedures: Show a list of procedures for the user to jump to. */
  ShowProcedures() {
    // Stub!
  }
  // #endregion

  // #region "Event Handling"
  /** onUpdate: Handle the Update event. */
  private onUpdate(update: ViewUpdate) {
    // forceParsing(update.view)
    if (update.docChanged) {
      if (!this.ParentEditor) {
        //console.log("1")
        this.UpdateSharedContext();
        //console.log(this.LintContext)
      } else if (
        this.ParentEditor &&
        this.Options.ParseMode == ParseMode.Normal
      ) {
        //console.log("2")
        //console.log("old",this.LintContext)
        this.ParentEditor.UpdateSharedContext();
        //console.log("new",this.LintContext)
      }
    }
    if (this.Options.OnUpdate != null) {
      this.Options.OnUpdate(update.docChanged, update);
    }
  }
  // #endregion
}

/** Export classes globally. */
const Localized = new LocalizationManager();
try {
  (window as any).GalapagosEditor = GalapagosEditor;
  (window as any).EditorLocalized = Localized;
} catch (error) {}
export { Localized };
