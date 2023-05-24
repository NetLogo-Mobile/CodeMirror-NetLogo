import { EditorView } from 'codemirror';
import { GalapagosEditor } from 'src/editor';
/** prettify: Change selection to fit formatting standards. */
export declare const prettify: (view: EditorView, from?: number | null, to?: number | null) => number;
/** prettifyAll: Make whole code file follow formatting standards. */
export declare const prettifyAll: (view: EditorView, Editor: GalapagosEditor) => void;
//# sourceMappingURL=prettify.d.ts.map