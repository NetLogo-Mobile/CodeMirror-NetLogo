import { EditorView } from '@codemirror/view';

const lightTheme = EditorView.theme({
  '&': {
    height: '100%',
  },
  '.cm-diagnostic': {
    fontSize: '0.9em',
    padding: '0.3em 0.5em',
  },
  '.cm-tooltip.cm-tooltip-extendable': {
    cursor: 'pointer',
  },
  '.cm-tooltip.cm-tooltip-explain': {
    fontSize: '0.9em',
    backgroundColor: '#FFFFF0',
    padding: '0.3em 0.5em',
    '& .cm-tooltip-arrow:before': {
      borderTopColor: '#FFFFF0',
      backgroundColor: '#FFFFF0',
    },
    '& .cm-tooltip-arrow:after': {
      borderTopColor: 'transparent',
      borderBottomColor: '#FFFFF0',
    },
  },
});

export { lightTheme };
