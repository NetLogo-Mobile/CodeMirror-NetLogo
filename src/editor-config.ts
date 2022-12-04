import { EditorView, ViewUpdate } from '@codemirror/view';

/** Options: Options of an editor. */
export interface EditorConfig {
  /** Language: The programming language of this editor. */
  Language?: EditorLanguage;
  /** ReadOnly: Is the editor in read-only mode? */
  ReadOnly?: boolean;
  /** OneLine: Is the editor in forced one-line mode? */
  // Basically, we will make the editor an one-line input without additional features & keyboard shortcuts.
  OneLine?: boolean;
  /** Wrapping: Should we auto-wrap lines? */
  Wrapping?: boolean;
  /** OnUpdate: Handle the Update event. */
  OnUpdate?: (DocumentChanged: boolean, ViewUpdate: ViewUpdate) => void;
  /** OnKeyDown: Handle the KeyDown event. */
  OnKeyDown?: (Event: KeyboardEvent, View: EditorView) => boolean | void;
  /** OnKeyUp: Handle the KeyUp event. */
  OnKeyUp?: (Event: KeyboardEvent, View: EditorView) => boolean | void;
  /** OnDictionaryClick: Triggers when a dictionary tooltip is clicked. */
  OnDictionaryClick?: (Key: string) => void;
}

/** Language: Language. */
export enum EditorLanguage {
  NetLogo = 0,
  Javascript = 1,
  HTML = 2,
  CSS = 3,
}

/** Export classes globally. */
try {
  (window as any).EditorLanguage = EditorLanguage;
} catch (error) {}
