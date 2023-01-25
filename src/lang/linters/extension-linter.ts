import { syntaxTree } from '@codemirror/language';
import { linter, Diagnostic } from '@codemirror/lint';
import { SyntaxNode } from '@lezer/common';
import { EditorState } from '@codemirror/state';
import { preprocessStateExtension } from '../../codemirror/extension-regex-state';
import { PrimitiveManager } from '../primitives/primitives';
import { NetLogoType } from '../classes';
import { Localized } from '../../i18n/localized';
import { buildLinter } from './linter-builder';

let primitives = PrimitiveManager;

// Checks anything labelled 'Identifier'
export const ExtensionLinter = buildLinter((view, parseState) => {
  const diagnostics: Diagnostic[] = [];
  syntaxTree(view.state)
    .cursor()
    .iterate((noderef) => {
      if (noderef.name.includes('Args') && !noderef.name.includes('Special')) {
        const Node = noderef.node;
        const value = view.state
          .sliceDoc(noderef.from, noderef.to)
          .toLowerCase();
        let vals = value.split(':');
        if (vals.length > 1) {
          let found = false;
          for (let e of parseState.Extensions) {
            if (vals[0] == e) {
              found = true;
              break;
            }
          }
          if (!found) {
            diagnostics.push({
              from: noderef.from,
              to: noderef.to,
              severity: 'error',
              message: Localized.Get('Invalid extension _.', vals[0]),
            });
          }
        }
      }
    });
  return diagnostics;
});
