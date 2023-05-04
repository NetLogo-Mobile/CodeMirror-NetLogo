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
export enum EditorLanguage {
  NetLogo = 0,
  Javascript = 1,
  HTML = 2,
  CSS = 3,
}

/** ParseMode: The parsing mode. */
export enum ParseMode {
  /** Normal: Normal mode, where the code is supposed to be an entire model. */
  Normal = 'Normal',
  /** Oneline: Oneline mode, where the code is supposed to be a single line of command statement. */
  Oneline = 'Oneline',
  /** OnelineReporter: Oneline reporter mode, where the code is supposed to be a single line of reporter statment. */
  OnelineReporter = 'OnelineReporter',
  /** Embedded: Embedded mode, where the code is supposed to be multiple lines of command statements. */
  Embedded = 'Embedded',
  /** Generative: Generative mode, a special Normal mode that does not provide context to its parent but instead take it back. */
  Generative = 'Generative',
}

/** Export classes globally. */
try {
  (window as any).EditorLanguage = EditorLanguage;
} catch (error) {}
