import { EditorView } from '@codemirror/view';

const lightTheme = EditorView.theme({
  '&.cm-editor': {
    height: '100%',
    '&.cm-focused': {
      outline: 'none',
    },
  },
  '.cm-diagnostic': {
    fontSize: '0.9em',
    padding: '0.3em 0.5em',
  },
  '.cm-tooltip-extendable': {
    cursor: 'pointer'
  },
  '.cm-tooltip-extendable:hover': {
    textDecoration: 'underline'
  },
  '.cm-editor.cm-focused': {
    outline: 'none',
  },
});

export { lightTheme };
