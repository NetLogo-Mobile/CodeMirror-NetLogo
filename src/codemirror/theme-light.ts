import { EditorView } from '@codemirror/view';

const lightTheme = EditorView.theme({
  '&': {
    height: '100%',
  },
  '.cm-diagnostic': {
    padding: '0.3em 0.5em',
  },
});

export { lightTheme };
