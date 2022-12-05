import { EditorView } from 'codemirror';
import { ViewUpdate } from '@codemirror/view';

/** UpdateExtension: Extension for Handling Update. */
const updateExtension = function (callback: (update: ViewUpdate) => void) {
  return EditorView.updateListener.of(callback);
};

export { updateExtension };
