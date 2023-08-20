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
    cursor: 'pointer',
  },
  '.cm-tooltip-extendable:hover': {
    textDecoration: 'underline',
  },
  '.cm-editor.cm-focused': {
    outline: 'none',
  },
  '.cm-gutter-lint': {
    width: '3px',
  },
  '.cm-gutter-lint .cm-gutterElement': {
    padding: '0',
  },
  '.cm-lint-marker': {
    width: '100%',
    height: '100%',
  },
  '.cm-lint-marker-error': {
    background: '#cc2200',
    content: 'none',
  },
  '.cm-lint-marker-warning': {
    background: '#FAD842',
    content: 'none',
  },
  '.cm-added': {
    textDecoration: 'overline underline',
    textDecorationColor: '#117432',
    textDecorationThickness: '2px',
  },
  '.cm-removed': {
    textDecoration: 'overline underline',
    textDecorationColor: '#cc2200',
    textDecorationThickness: '2px',
  },
  '.cm-gutters': {
    userSelect: 'none',
    webkitUserSelect: 'none',
    msUserSelect: 'none',
  },
});

export { lightTheme };
