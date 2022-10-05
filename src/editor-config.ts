import { ViewUpdate } from "@codemirror/view";

/** Options: Options of an editor. */
export interface EditorConfig {
    /** Language: The programming language of this editor. */
    Language?: EditorLanguage; 
    /** HighlightOnly: Do we only need a highlighted text instead of the full editor? */
    HighlightOnly?: boolean; // To be implemented
    /** ReadOnly: Is the editor in read-only mode? */
    ReadOnly?: boolean; // To be implemented
    /** OneLine: Is the editor in forced one-line mode? */
    // Basically, we will make the editor an one-line input without additional features & keyboard shortcuts.
    OneLine?: boolean;  // To be implemented
    /** OnUpdate: Handle the Update event. */
    OnUpdate?: (DocumentChanged: boolean, ViewUpdate: ViewUpdate) => void;
    /** OnKeyDown: Handle the Keydown event. */
    OnKeyDown; // To be implemented
}

/** Language: Language. */
export enum EditorLanguage {
    NetLogo = 0,
    Javascript = 1,
    HTML = 2,
    CSS = 3
}

/** Export classes globally. */
try {
  (window as any).EditorLanguage = EditorLanguage;
} catch (error) { }
