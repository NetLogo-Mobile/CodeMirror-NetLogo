import { EditorView } from 'codemirror';
/** prettify: Change selection to fit formatting standards. */
export declare const prettify: (view: EditorView, from?: number | null, to?: number | null) => number;
/** prettifyAll: Make whole code file follow formatting standards. */
export declare const prettifyAll: (view: EditorView) => void;
