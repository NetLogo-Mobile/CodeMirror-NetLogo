import { EditorView } from '@codemirror/view';

const lightTheme = EditorView.theme({
  '&': {
    height: '100%',
  },
});

export { lightTheme };
