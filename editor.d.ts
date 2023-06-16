import { EditorView } from '@codemirror/view';
import { LanguageSupport } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Extension } from '@codemirror/state';
import { LocalizationManager } from './i18n/localized';
import { EditorConfig, ParseMode } from './editor-config';
import { StateNetLogo } from './codemirror/extension-state-netlogo';
import { StatePreprocess } from './codemirror/extension-state-preprocess';
import { RuntimeError } from './lang/linters/runtime-linter';
import { PreprocessContext, LintContext } from './lang/classes/contexts';
import { EditingFeatures } from './features/editing';
import { SelectionFeatures } from './features/selection';
import { SemanticFeatures } from './features/semantics';
import { CodeEditing } from './lang/services/code-editing';
/** GalapagosEditor: The editor component for NetLogo Web / Turtle Universe. */
export declare class GalapagosEditor {
    /** CodeMirror: The CodeMirror 6 component. */
    readonly CodeMirror: EditorView;
    /** Options: Options of this editor. */
    readonly Options: EditorConfig;
    /** Editable: Compartment of the EditorView. */
    private readonly Editable;
    /** Language: Language of the EditorView. */
    readonly Language: LanguageSupport;
    /** Parent: Parent HTMLElement of the EditorView. */
    readonly Parent: HTMLElement;
    /** Linters: The linters used in this instance. */
    readonly Linters: Extension[];
    /** Editing: The editing features of this editor. */
    readonly Editing: EditingFeatures;
    /** Selection: The selection features of this editor. */
    readonly Selection: SelectionFeatures;
    /** Semantics: The semantics features of this editor. */
    readonly Semantics: SemanticFeatures;
    /** Operations: The code editing features of this editor. */
    readonly Operations: CodeEditing;
    /** LineWidth: The width of the line, used for prettying. */
    readonly LineWidth: number;
    /** Constructor: Create an editor instance. */
    constructor(Parent: HTMLElement, Options: EditorConfig);
    /** GetState: Get the current parser state of the NetLogo code. */
    GetState(Refresh?: boolean): StateNetLogo;
    /** GetPreprocessState: Get the preprocess parser state of the NetLogo code. */
    GetPreprocessState(): StatePreprocess;
    /** SetCode: Set the code of the editor. */
    SetCode(code: string): void;
    /** GetCode: Get the code from the editor. */
    GetCode(): string;
    /** GetCodeSlice: Returns a slice of code from the editor. */
    GetCodeSlice(Start: number, End: number): string;
    /** IsReadOnly: Whether the editor is readonly. */
    IsReadOnly: boolean;
    /** SetReadOnly: Set the readonly status for the editor. */
    SetReadOnly(Status: boolean): void;
    /** AddChild: Add a child editor. */
    AddChild(Child: GalapagosEditor): void;
    /** SyncContext: Sync the context of the child editor. */
    SyncContext(Child: GalapagosEditor): void;
    /** Blur: Make the editor lose the focus (if any). */
    Blur(): void;
    /** Focus: Make the editor gain the focus (if possible). */
    Focus(): void;
    /** CloseCompletion: Forcible close the auto completion. */
    CloseCompletion(): void;
    /** SetWidgetVariables: Sync the widget-defined global variables to the syntax parser/linter. */
    SetWidgetVariables(Variables: string[], ForceLint?: boolean): void;
    /** SetMode: Set the parsing mode of the editor. */
    SetMode(Mode: ParseMode, ForceLint?: boolean): void;
    /** SetCompilerErrors: Sync the compiler errors and present it on the editor. */
    SetCompilerErrors(Errors: RuntimeError[]): void;
    /** SetCompilerErrors: Sync the runtime errors and present it on the editor. */
    SetRuntimeErrors(Errors: RuntimeError[]): void;
    /** FixUnknownErrors: Fix the unknown errors. */
    private FixUnknownErrors;
    /** ID: ID of the editor. */
    private ID;
    /** Children: The connected editors. */
    readonly Children: GalapagosEditor[];
    /** ParentEditor: The parent editor of this instance. */
    ParentEditor: GalapagosEditor | null;
    /** PreprocessContext: The combined preprocessed context of this editor. */
    PreprocessContext: PreprocessContext;
    /** LintContext: The combined main parsing context of this editor. */
    LintContext: LintContext;
    /** Version: Version of the state (for linter cache). */
    private Version;
    /** IsVisible: Whether this editor is visible. */
    IsVisible: boolean;
    SetContext(context: string): void;
    /** GetID: Get ID of the editor. */
    GetID(): number;
    /** GetVersion: Get version of the state. */
    GetVersion(): number;
    /** SetVisible: Set the visibility status of the editor. */
    SetVisible(status: boolean): void;
    /** GetChildren: Get the logical children of the editor. */
    private GetChildren;
    /** UpdateContext: Try to update the context of this editor. */
    UpdateContext(): boolean;
    /** UpdateSharedContext: Update the shared context of the editor. */
    private UpdateSharedContext;
    /** RefreshContexts: Refresh contexts of the editor. */
    private RefreshContexts;
    /** UpdatePreprocessContext: Try to update the context of this editor. */
    UpdatePreprocessContext(): boolean;
    /** UpdateSharedPreprocess: Update the shared preprocess context of the editor. */
    private UpdateSharedPreprocess;
    /** ForceLintAsync: Force the editor to lint without rendering. */
    ForceLintAsync(): Promise<Diagnostic[]>;
    /** ForceParse: Force the editor to finish any parsing. */
    ForceParse(SetDirty?: boolean): void;
    /** ForceLint: Force the editor to do another round of linting. */
    ForceLint(): void;
    /** onUpdate: Handle the Update event. */
    private onUpdate;
}
/** Export classes globally. */
declare const Localized: LocalizationManager;
export { Localized };
//# sourceMappingURL=editor.d.ts.map