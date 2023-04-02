import { ViewUpdate } from '@codemirror/view';
/** UpdateExtension: Extension for Handling Update. */
declare const updateExtension: (callback: (update: ViewUpdate) => void) => import("@codemirror/state").Extension;
export { updateExtension };
