import { tags } from '@lezer/highlight';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';

const highlightStyle = HighlightStyle.define([
  { tag: tags.strong, color: '#007F69', 'font-weight': 'bold' },
  { tag: tags.variableName, color: '#0000AA' },
  { tag: tags.string, color: '#963700' },
  { tag: tags.lineComment, color: '#5A5A5A' },
  { tag: tags.bool, color: '#660096' },
]);

const highlight = syntaxHighlighting(highlightStyle);

export { highlight, highlightStyle };
