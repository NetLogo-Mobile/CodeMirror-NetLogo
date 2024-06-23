import { EditorView, ViewUpdate, keymap, placeholder, ViewPlugin } from '@codemirror/view';
import { closeCompletion, acceptCompletion } from '@codemirror/autocomplete';
import { forceParsing, LanguageSupport } from '@codemirror/language';
import { Diagnostic, linter, lintGutter } from '@codemirror/lint';
import { Prec, Compartment, EditorState, Extension, TransactionSpec } from '@codemirror/state';
import { indentWithTab } from '@codemirror/commands';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';

import { LocalizationManager } from './i18n/localized';
import { Dictionary } from './i18n/dictionary';
import { EditorConfig, EditorLanguage, ParseMode } from './editor-config';
import { highlight } from './codemirror/style-highlight';
import { updateExtension } from './codemirror/extension-update';
import { stateExtension, StateNetLogo } from './codemirror/extension-state-netlogo';
import { preprocessStateExtension, StatePreprocess } from './codemirror/extension-state-preprocess';
import { buildToolTips } from './codemirror/extension-tooltip';
import { lightTheme } from './codemirror/theme-light';

import { NetLogo } from './lang/netlogo.js';
import { netlogoLinters } from './lang/linters/linters';
import { buildLinter } from './lang/linters/linter-builder';
import { CompilerLinter, RuntimeError, RuntimeLinter } from './lang/linters/runtime-linter';
import { PreprocessContext, LintContext } from './lang/classes/contexts';

import { EditingFeatures } from './features/editing';
import { SelectionFeatures } from './features/selection';
import { SemanticFeatures } from './features/semantics';
import { CodeEditing } from './lang/services/code-editing';
import { basicSetup } from 'codemirror';
import { Breed } from './lang/classes/structures';
import { createColorPickerPlugin } from './codemirror/cp-widget-extension';

export class GalapagosEditor {
  /** CodeMirror: The CodeMirror 6 component. */
  public readonly CodeMirror: EditorView;
  /** Options: Options of this editor. */
  public readonly Options: EditorConfig;
  /** Editable: Compartment of the EditorView. */
  private readonly Editable: Compartment;
  /** Language: The language support of this editor. */
  public readonly Language: LanguageSupport;
  /** Parent: Parent HTMLElement of the EditorView. */
  public readonly Parent: HTMLElement;
  /** Linters: The linters used in this instance. */
  public readonly Linters: Extension[] = [];
  /** Editing: The editing features of this editor. */
  public readonly Editing: EditingFeatures;
  /** Selection: The selection features of this editor. */
  public readonly Selection: SelectionFeatures;
  /** Semantics: The semantics features of this editor. */
  public readonly Semantics: SemanticFeatures;
  /** Operations: The code editing features of this editor. */
  public readonly Operations: CodeEditing;
  /** LineWidth: The width of the line, used for prettying. */
  public readonly LineWidth: number = 50;

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
        this.Language = NetLogo(this);
        Extensions.push(preprocessStateExtension);
        Extensions.push(stateExtension);
        Extensions.push(buildToolTips(this));
        Dictionary.ClickHandler = Dictionary.ClickHandler ?? Options.OnDictionaryClick;
        this.Linters = netlogoLinters.map((linter) => buildLinter(linter, this));
        Extensions.push(...this.Linters);
        Extensions.push(linter(CompilerLinter));
        Extensions.push(linter(RuntimeLinter));
        Extensions.push(lintGutter());
    }
    Extensions.push(this.Language);
    // Color picker
    if (Options.OnColorPickerCreate) Extensions.push(createColorPickerPlugin(Options.OnColorPickerCreate));
    // Keybindings
    var KeyBindings = Options.KeyBindings ?? [];
    if (this.Options.OneLine) {
      if (KeyBindings.findIndex((Binding) => Binding.key === 'Enter') === -1)
        KeyBindings.push({ key: 'Enter', run: () => true });
      if (KeyBindings.findIndex((Binding) => Binding.key === 'Tab') === -1)
        KeyBindings.push({ key: 'Tab', run: acceptCompletion });
    }
    Extensions.push(keymap.of(KeyBindings));
    // DOM handlers
    Extensions.push(
      EditorView.domEventHandlers({
        keydown: (Event) => Options.OnKeyDown?.(Event, this),
        keyup: (Event) => Options.OnKeyUp?.(Event, this),
        click: (Event) => Options.OnClick?.(Event, this),
      })
    );
    // Wrapping mode
    if (this.Options.Wrapping) Extensions.push(EditorView.lineWrapping);
    // Placeholder
    if (this.Options.Placeholder) Extensions.push(placeholder(this.Options.Placeholder));
    // Build the editor
    this.CodeMirror = new EditorView({
      extensions: Extensions,
      parent: Parent,
    });
    this.GetPreprocessState().SetEditor(this);
    this.Options.ParseMode = this.Options.ParseMode ?? ParseMode.Normal;
    this.GetState(false).Mode = this.Options.ParseMode;
    this.GetState(false).Preprocess = this.PreprocessContext;
    // Create features
    this.Editing = new EditingFeatures(this);
    this.Selection = new SelectionFeatures(this);
    this.Semantics = new SemanticFeatures(this);
    this.Operations = new CodeEditing(this.CodeMirror);
    // Disable Grammarly
    const el = this.Parent.getElementsByClassName('cm-content')[0];
    el.setAttribute('data-enable-grammarly', 'false');
  }

  // #region "Editor Statuses"
  /** GetState: Get the current parser state of the NetLogo code. */
  GetState(Refresh?: boolean): StateNetLogo {
    if (Refresh) this.UpdateContext();
    return this.CodeMirror.state.field(stateExtension);
  }
  /** GetPreprocessState: Get the preprocess parser state of the NetLogo code. */
  GetPreprocessState(): StatePreprocess {
    return this.CodeMirror.state.field(preprocessStateExtension);
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
  /** GetCodeSlice: Returns a slice of code from the editor. */
  GetCodeSlice(Start: number, End: number) {
    return this.CodeMirror.state.sliceDoc(Start, End);
  }
  /** IsReadOnly: Whether the editor is readonly. */
  IsReadOnly: boolean = false;
  /** SetReadOnly: Set the readonly status for the editor. */
  SetReadOnly(Status: boolean) {
    this.IsReadOnly = Status;
    this.CodeMirror.dispatch({
      effects: this.Editable.reconfigure(EditorView.editable.of(!Status)),
    });
    if (Status) {
      (document.querySelector('.cm-editor') as HTMLElement).style.backgroundColor = '#f5f5f5';
      (document.querySelector('.cm-editor') as HTMLElement).style.color = '#888';
    } else {
      (document.querySelector('.cm-editor') as HTMLElement).style.backgroundColor = '#fff';
      (document.querySelector('.cm-editor') as HTMLElement).style.color = '#000';
    }
  }
  /** AddChild: Add a child editor. */
  AddChild(Child: GalapagosEditor) {
    if (Child.Children.length > 0) throw new Error('Cannot add an editor that already has children as child.');
    this.Children.push(Child);
    Child.ID = ++this.NextChildID;
    Child.ParentEditor = this;
    Child.CodeMirror.state.field(stateExtension).EditorID = Child.ID;
    // Generative editors are sort of independent
    if (Child.Options.ParseMode !== ParseMode.Generative) {
      Child.LintContext = this.LintContext;
      Child.PreprocessContext = this.PreprocessContext;
      Child.GetState(false).Preprocess = this.PreprocessContext;
    }
  }
  /** RemoveChild: Remove a child editor. */
  RemoveChild(Child: GalapagosEditor) {
    // Remove from the list
    if (Child.ParentEditor !== this) throw new Error('Cannot remove an editor that is not my child.');
    var Index = this.Children.indexOf(Child);
    if (Index === -1) throw new Error('Cannot remove an editor that is not my child.');
    this.Children.splice(Index, 1);
    // Remove the context
    Child.ParentEditor = null;
    // Generative editors are sort of independent
    if (Child.Options.ParseMode !== ParseMode.Generative) {
      Child.LintContext = new LintContext();
      Child.PreprocessContext = new PreprocessContext();
      Child.GetState(false).Preprocess = Child.PreprocessContext;
    }
  }
  /** GetChild: Get the child editor by ID. */
  GetChild(ID: number) {
    if (ID == this.ID) return this;
    return this.Children.find((child) => child.ID == ID);
  }
  /** Detach: Detach the editor from its parent. */
  Detach() {
    if (this.ParentEditor == null) throw new Error('Cannot remove an editor that is not a child.');
    this.ParentEditor.RemoveChild(this);
  }
  /** SyncContext: Sync the context of the child editor. */
  SyncContext(Child: GalapagosEditor) {
    Child.LintContext = this.LintContext;
    Child.PreprocessContext = this.PreprocessContext;
    Child.GetState(false).Preprocess = this.PreprocessContext;
  }
  /** Blur: Make the editor lose the focus (if any). */
  Blur() {
    this.CodeMirror.contentDOM.blur();
  }
  /** Focus: Make the editor gain the focus (if possible). */
  Focus() {
    this.CodeMirror.focus();
  }
  /** CloseCompletion: Forcible close the auto completion. */
  CloseCompletion() {
    closeCompletion(this.CodeMirror);
  }
  /** SetWidgetVariables: Sync the widget-defined global variables to the syntax parser/linter. */
  SetWidgetVariables(Variables: string[], ForceLint?: boolean) {
    if (this.ParentEditor != null) throw new Error('Cannot set widget variables on a child editor.');
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
      State.SetDirty();
      if (this.Options.ParseMode == ParseMode.Normal) this.UpdateContext();
      else this.UpdateSharedContext();
      // this.UpdateContext();
      if (ForceLint) this.ForceLint();
    }
  }
  /** SetMode: Set the parsing mode of the editor. */
  SetMode(Mode: ParseMode, ForceLint?: boolean) {
    var State = this.GetState();
    var Current = State.Mode;
    if (Current != Mode) {
      State.Mode = Mode;
      this.UpdateContext();
      if (ForceLint) this.ForceLint();
    }
  }
  /** SetCompilerErrors: Sync the compiler errors and present it on the editor. */
  // TODO: Some errors come with start 2147483647, which needs to be rendered as a tip without position.
  SetCompilerErrors(Errors: RuntimeError[]) {
    var State = this.GetState();
    if (State.CompilerErrors.length == 0 && State.RuntimeErrors.length == 0 && Errors.length == 0) return;
    // Dealing with unknown errors
    this.FixUnknownErrors(Errors);
    // Set the errors
    State.CompilerErrors = Errors;
    State.RuntimeErrors = [];
    this.ForceLint();
    // Set the cursor position
    if (Errors.length > 0) this.Selection.SetCursorPosition(Errors[0].start);
  }
  /** SetCompilerErrors: Sync the runtime errors and present it on the editor. */
  SetRuntimeErrors(Errors: RuntimeError[]) {
    var State = this.GetState();
    if (State.RuntimeErrors.length == 0 && Errors.length == 0) return;
    // Dealing with unknown errors
    this.FixUnknownErrors(Errors);
    // Set the errors
    State.RuntimeErrors = Errors;
    this.ForceLint();
    // Set the cursor position
    if (Errors.length > 0) this.Selection.SetCursorPosition(Errors[0].start);
  }
  /** FixUnknownErrors: Fix the unknown errors. */
  private FixUnknownErrors(Errors: RuntimeError[]) {
    var Code = this.GetCode();
    var FirstBreak = Code.indexOf('\n');
    if (FirstBreak === -1) FirstBreak = Code.length;
    Errors.forEach((Error) => {
      if (Error.start == 2147483647) {
        Error.start = 0;
        Error.end = FirstBreak;
      } else {
        try {
          Error.code = Code.slice(Error.start, Error.end);
        } catch {}
      }
    });
  }
  // #endregion

  // #region "Context Sharing"
  /** ID: ID of the editor. */
  private ID: number = 0;
  /** Children: The connected editors. */
  public readonly Children: GalapagosEditor[] = [];
  /** NextChildID: The next child ID. */
  private NextChildID: number = 0;
  /** ParentEditor: The parent editor of this instance. */
  public ParentEditor: GalapagosEditor | null = null;
  /** PreprocessContext: The combined preprocessed context of this editor. */
  public PreprocessContext: PreprocessContext = new PreprocessContext();
  /** LintContext: The combined main parsing context of this editor. */
  public LintContext: LintContext = new LintContext();
  /** Version: Version of the state (for linter cache). */
  private Version: number = 0;
  /** IsVisible: Whether this editor is visible. */
  public IsVisible: boolean = true;
  /** SetContext: Set the context of the editor for one-line modes. */
  public SetContext(context: string) {
    if (
      (this.Options.ParseMode == ParseMode.Oneline || this.Options.ParseMode == ParseMode.Reporter) &&
      this.GetState(false).SetContext(context)
    ) {
      this.ForceParse();
      this.ForceLint();
    }
  }
  /** GetID: Get ID of the editor. */
  public GetID(): number {
    return this.ID;
  }
  /** GetVersion: Get version of the state. */
  public GetVersion(): number {
    return this.Version;
  }
  /** SetVisible: Set the visibility status of the editor. */
  public SetVisible(status: boolean) {
    if (this.IsVisible == status) return;
    this.IsVisible = status;
    if (this.IsVisible) this.ForceLint();
  }
  /** GetChildren: Get the logical children of the editor. */
  private GetChildren(): GalapagosEditor[] {
    // For the generative mode, it takes the context from its parent but does not contribute to it
    if (this.Options.ParseMode == ParseMode.Generative) {
      if (this.ParentEditor) return [this, this.ParentEditor];
    } else if (this.Options.ParseMode == ParseMode.Normal) return [...this.Children, this];
    return [this];
  }
  /** UpdateContext: Try to update the context of this editor. */
  public UpdateContext(): boolean {
    const State = this.CodeMirror.state.field(stateExtension);
    if (!State.GetDirty()) return false;
    // Force the parsing
    this.ForceParse();
    this.Version += 1;
    State.ParseState(this.CodeMirror.state);
    // Update the shared editor, if needed
    if (!this.ParentEditor || this.Options.ParseMode == ParseMode.Generative) {
      this.UpdateSharedContext();
    } else if (this.ParentEditor && this.Options.ParseMode == ParseMode.Normal) {
      this.ParentEditor.UpdateContext();
    }
    return true;
  }
  /** UpdateSharedContext: Update the shared context of the editor. */
  private UpdateSharedContext() {
    var mainLint = this.LintContext.Clear();
    for (var child of this.GetChildren()) {
      //if (child.Options.ParseMode == ParseMode.Normal || child == this) {
      let state = child.CodeMirror.state.field(stateExtension);
      for (var name of state.Extensions) mainLint.Extensions.set(name, child.ID);
      for (var name of state.Globals) mainLint.Globals.set(name, child.ID);
      for (var name of state.WidgetGlobals) mainLint.WidgetGlobals.set(name, child.ID);
      for (var [name, procedure] of state.Procedures) {
        procedure.EditorID = child.ID;
        mainLint.Procedures.set(name, procedure);
      }
      for (var [name, breed] of state.Breeds) {
        breed.EditorID = child.ID;
        var current = mainLint.Breeds.get(name);
        if (!current) {
          // Here, we make a copy to avoid contamination
          current = new Breed(breed.Singular, breed.Plural, [...breed.Variables], breed.BreedType);
          mainLint.Breeds.set(name, current);
        } else {
          var variables = current.Variables;
          breed.Variables.forEach((variable) => {
            if (!variables.includes(variable)) variables.push(variable);
          });
        }
      }
    }
    this.RefreshContexts();
  }
  /** RefreshContexts: Refresh contexts of the editor. */
  private RefreshContexts() {
    if (this.IsVisible) {
      this.ForceParse(false);
      this.ForceLint();
    }
    for (var child of this.Children) {
      child.Version += 1;
      child.RefreshContexts();
    }
  }
  /** UpdatePreprocessContext: Try to update the context of this editor. */
  public UpdatePreprocessContext(): boolean {
    // Force the parsing
    this.Version += 1;
    // Update the shared editor, if needed
    if (!this.ParentEditor || this.Options.ParseMode == ParseMode.Generative) {
      this.UpdateSharedPreprocess();
    } else if (this.ParentEditor && this.Options.ParseMode == ParseMode.Normal) {
      this.ParentEditor.UpdatePreprocessContext();
    }
    return true;
  }
  /** UpdateSharedPreprocess: Update the shared preprocess context of the editor. */
  private UpdateSharedPreprocess() {
    var mainPreprocess = this.PreprocessContext.Clear();
    for (var child of this.GetChildren()) {
      if (child.Options.ParseMode == ParseMode.Normal || child == this) {
        let preprocess = child.CodeMirror.state.field(preprocessStateExtension);
        for (var I = 0; I < preprocess.PluralBreeds.length; I++) {
          var Plural = preprocess.PluralBreeds[I];
          var Singular = preprocess.SingularBreeds[I];
          var Type = preprocess.BreedTypes[I];
          mainPreprocess.PluralBreeds.set(Plural, child.ID);
          mainPreprocess.SingularBreeds.set(Singular, child.ID);
          mainPreprocess.PluralToSingulars.set(Plural, Singular);
          mainPreprocess.SingularToPlurals.set(Singular, Plural);
          mainPreprocess.BreedTypes.set(Plural, Type);
        }
        for (var [p, vars] of preprocess.BreedVars) {
          for (var variable of vars) {
            mainPreprocess.BreedVars.set(variable, child.ID);
            let vars: string[] = mainPreprocess.BreedVarToPlurals.has(variable)
              ? mainPreprocess.BreedVarToPlurals.get(variable) ?? []
              : [];
            vars.push(p);
            mainPreprocess.BreedVarToPlurals.set(variable, vars);
          }
        }
        for (var [p, num_args] of preprocess.Commands) {
          mainPreprocess.Commands.set(p, num_args);
          mainPreprocess.CommandsOrigin.set(p, child.ID);
        }
        for (var [p, num_args] of preprocess.Reporters) {
          mainPreprocess.Reporters.set(p, num_args);
          mainPreprocess.ReportersOrigin.set(p, child.ID);
        }
      }
    }
  }
  // #endregion

  // #region "Linting and Parsing"
  /** ForceLintAsync: Force the editor to lint without rendering. */
  async ForceLintAsync(): Promise<Diagnostic[]> {
    var Diagnostics = [];
    for (var Extension of this.Linters) {
      var Results = await Promise.resolve((Extension as any).Source(this.CodeMirror));
      Diagnostics.push(...Results);
    }
    return Diagnostics;
  }
  /** ForceParse: Force the editor to finish any parsing. */
  ForceParse(SetDirty: boolean = true) {
    forceParsing(this.CodeMirror, this.CodeMirror.state.doc.length, 100000);
    if (SetDirty) this.CodeMirror.state.field(stateExtension).SetDirty();
  }
  /** ForceLint: Force the editor to do another round of linting. */
  ForceLint() {
    // Note that there are 2 linters that are not in this.Linters: runtime/compile
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

  // #region "Event Handling"
  /** onUpdate: Handle the Update event. */
  private onUpdate(update: ViewUpdate) {
    if (update.docChanged) this.SetCompilerErrors([]);
    if (this.Options.OnUpdate != null) this.Options.OnUpdate(update.docChanged, update);
    if (update.focusChanged) {
      if (this.CodeMirror.hasFocus) {
        if (this.Options.OnFocused != null) this.Options.OnFocused(this.CodeMirror);
      } else {
        if (this.Options.OnBlurred != null) this.Options.OnBlurred(this.CodeMirror);
      }
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
