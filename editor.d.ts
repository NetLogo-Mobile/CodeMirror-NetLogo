import { EditorView } from 'codemirror';
import { LanguageSupport } from '@codemirror/language';
import { EditorState, Extension } from '@codemirror/state';
import { EditorConfig, ParseMode } from './editor-config';
import { StateNetLogo } from './codemirror/extension-state-netlogo';
import { StatePreprocess } from './codemirror/extension-state-preprocess.js';
import { RuntimeError } from './lang/linters/runtime-linter.js';
import { Diagnostic } from '@codemirror/lint';
import { LocalizationManager } from './i18n/localized.js';
import { Tree, SyntaxNodeRef } from '@lezer/common';
import { PreprocessContext, LintContext } from './lang/classes.js';
/** GalapagosEditor: The editor component for NetLogo Web / Turtle Universe. */
export declare class GalapagosEditor {
    readonly EditorState: EditorState;
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
    /** Constructor: Create an editor instance. */
    constructor(Parent: HTMLElement, Options: EditorConfig);
    /** Highlight: Highlight a given snippet of code. */
    Highlight(Content: string): HTMLElement;
    private highlightInternal;
    /** GetState: Get the current parser state of the NetLogo code. */
    GetState(Refresh?: boolean): StateNetLogo;
    /** GetPreprocessState: Get the preprocess parser state of the NetLogo code. */
    GetPreprocessState(): StatePreprocess;
    /** GetSyntaxTree: Get the syntax tree of the NetLogo code. */
    GetSyntaxTree(): Tree;
    /** SyntaxNodesAt: Iterate through syntax nodes at a certain position. */
    SyntaxNodesAt(Position: number, Callback: (Node: SyntaxNodeRef) => void): void;
    /** GetRecognizedMode: Get the recognized program mode. */
    GetRecognizedMode(): string;
    /** SetCode: Set the code of the editor. */
    SetCode(code: string): void;
    /** GetCode: Get the code from the editor. */
    GetCode(): string;
    /** SetReadOnly: Set the readonly status for the editor. */
    SetReadOnly(status: boolean): void;
    /** AddChild: Add a child editor. */
    AddChild(child: GalapagosEditor): void;
    /** SetCursorPosition: Set the cursor position of the editor. */
    SetCursorPosition(position: number): void;
    /** Blur: Make the editor lose the focus (if any). */
    Blur(): void;
    /** Focus: Make the editor gain the focus (if possible). */
    Focus(): void;
    /** Prettify: Prettify the selection ofNetLogo code. */
    Prettify(): void;
    /** PrettifyAll: Prettify all the NetLogo code. */
    PrettifyAll(): void;
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
    /** GetID: Get ID of the editor. */
    GetID(): number;
    /** GetVersion: Get version of the state. */
    GetVersion(): number;
    SetVisible(status: boolean): void;
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
    /** ForEachDiagnostic: Loop through all linting diagnostics throughout the code. */
    ForEachDiagnostic(Callback: (d: Diagnostic, from: number, to: number) => void): void;
    /** ForceLintAsync: Force the editor to lint without rendering. */
    ForceLintAsync(): Promise<Diagnostic[]>;
    /** ForceParse: Force the editor to finish any parsing. */
    ForceParse(SetDirty?: boolean): void;
    /** ForceLint: Force the editor to do another round of linting. */
    ForceLint(): void;
    /** Undo: Make the editor undo. Returns false if no group was available. */
    Undo(): void;
    /** Redo: Make the editor Redo. Returns false if no group was available. */
    Redo(): void;
    /** ClearHistory: Clear the change history. */
    ClearHistory(): void;
    /** Find: Find a keyword in the editor and loop over all matches. */
    Find(Keyword: string): void;
    /** Replace: Loop through the matches and replace one at a time. */
    Replace(Source: string, Target: string): void;
    /** FindAll: Find all the matching words in the editor. */
    FindAll(Source: string): void;
    /** ReplaceAll: Replace the all the matching words in the editor. */
    ReplaceAll(Source: string, Target: string): void;
    /** JumpTo: Jump to a certain line. */
    JumpTo(Line: number): void;
    /** SelectAll: Select all text in the editor. */
    SelectAll(): void;
    /** Select: Select and scroll to a given range in the editor. */
    Select(Start: number, End: number): void;
    /** GetSelection: Returns an object of the start and end of
     *  a selection in the editor. */
    GetSelection(): {
        from: number;
        to: number;
    };
    /** GetSelectionCode: Returns the selected code in the editor. */
    GetSelectionCode(): string;
    /** ShowFind: Show the finding interface. */
    ShowFind(): void;
    /** ShowReplace: Show the replace interface. */
    ShowReplace(): void;
    /** ShowJumpTo: Show the jump-to-line interface. */
    ShowJumpTo(): void;
    /** HideJumpTo: Hide line interface. */
    HideJumpTo(): void;
    /** HideAllInterfaces: Hide all interfaces available. */
    HideAllInterfaces(): void;
    /** ShowProcedures: Show a list of procedures for the user to jump to. */
    ShowProcedures(): void;
    /** onUpdate: Handle the Update event. */
    private onUpdate;
}
/** Export classes globally. */
declare const Localized: LocalizationManager;
export { Localized };
