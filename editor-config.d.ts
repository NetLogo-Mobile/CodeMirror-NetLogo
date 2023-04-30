import { EditorView, ViewUpdate } from '@codemirror/view';
/** Options: Options of an editor. */
export interface EditorConfig {
    /** Language: The programming language of this editor. */
    Language?: EditorLanguage;
    /** ReadOnly: Is the editor in read-only mode? */
    ReadOnly?: boolean;
    /** OneLine: Is the editor in forced one-line mode? */
    OneLine?: boolean;
    /** ParseMode: The parsing mode of the editor. */
    ParseMode?: ParseMode;
    /** Wrapping: Should we auto-wrap lines? */
    Wrapping?: boolean;
    /** OnUpdate: Handle the Update event. */
    OnUpdate?: (DocumentChanged: boolean, ViewUpdate: ViewUpdate) => void;
    /** OnKeyDown: Handle the KeyDown event. */
    OnKeyDown?: (Event: KeyboardEvent, View: EditorView) => boolean | void;
    /** OnKeyUp: Handle the KeyUp event. */
    OnKeyUp?: (Event: KeyboardEvent, View: EditorView) => boolean | void;
    /** OnFocused: Handle the focused event. */
    OnFocused?: (View: EditorView) => void;
    /** OnBlurred: Handle the blurred event. */
    OnBlurred?: (View: EditorView) => void;
    /** OnDictionaryClick: Triggers when a dictionary tooltip is clicked. */
    OnDictionaryClick?: (Key: string) => void;
}
/** EditorLanguage: Language. */
export declare enum EditorLanguage {
    NetLogo = 0,
    Javascript = 1,
    HTML = 2,
    CSS = 3
}
/** ParseMode: The parsing mode. */
export declare enum ParseMode {
    Normal = "Normal",
    Oneline = "Oneline",
    OnelineReporter = "OnelineReporter",
    Embedded = "Embedded"
}