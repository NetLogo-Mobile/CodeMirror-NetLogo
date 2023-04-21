import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { EditorSelection } from '@codemirror/state';
import { Localized } from '../../editor';
import { Linter } from './linter-builder';
import { PrimitiveManager } from '../primitives/primitives';
import {
  checkValidIdentifier,
  getCheckContext,
} from './utils/check-identifier';
import { prettify } from '../../codemirror/prettify';
import { SyntaxNode } from '@lezer/common';
import { EditorView } from 'codemirror';

let primitives = PrimitiveManager;

// ExtensionLinter: Checks if extension primitives are used without declaring
// the extension, or invalid extensions are declared
export const ExtensionLinter: Linter = (
  view,
  preprocessContext,
  lintContext
) => {
  const diagnostics: Diagnostic[] = [];
  let foundExtension = false;
  let extension_index = 0;
  let extension_node: null | SyntaxNode = null;
  const context = getCheckContext(view, lintContext, preprocessContext);
  syntaxTree(view.state)
    .cursor()
    .iterate((noderef) => {
      if (noderef.name == 'Extensions') {
        noderef.node.getChildren('Identifier').map((child) => {
          let name = view.state.sliceDoc(child.from, child.to);
          if (primitives.GetExtensions().indexOf(name) == -1) {
            diagnostics.push({
              from: child.from,
              to: child.to,
              severity: 'warning',
              message: Localized.Get('Unsupported extension _.', name),
            });
          }
        });
        noderef.node.getChildren('CloseBracket').map((child) => {
          extension_index = child.from;
          foundExtension = true;
          extension_node = noderef.node;
        });
      } else if (
        (noderef.name.includes('Args') ||
          (noderef.name.includes('Unsupported') &&
            noderef.node.parent?.name != 'VariableName' &&
            noderef.node.parent?.name != 'Arguments' &&
            noderef.node.parent?.name != 'AnonArguments' &&
            noderef.node.parent?.name != 'ProcedureName' &&
            !checkValidIdentifier(
              noderef.node,
              view.state.sliceDoc(noderef.from, noderef.to),
              context
            ))) &&
        !noderef.name.includes('Special')
      ) {
        const value = view.state
          .sliceDoc(noderef.from, noderef.to)
          .toLowerCase();
        let vals = value.split(':');
        if (vals.length <= 1 || lintContext.Extensions.has(vals[0])) return;
        diagnostics.push({
          from: noderef.from,
          to: noderef.to,
          severity: 'error',
          message: !noderef.name.includes('Unsupported')
            ? Localized.Get('Missing extension _.', vals[0])
            : Localized.Get('Unsupported missing extension _.', vals[0]),
          actions: [
            {
              name: Localized.Get('Add'),
              apply(view, from, to) {
                addExtension(
                  view,
                  extension_index,
                  vals[0],
                  extension_node,
                  true
                );
              },
            },
          ],
        });
      }
    });
  return diagnostics;
};

export const addExtension = (
  view: EditorView,
  index: number,
  extension: string,
  extension_node: null | SyntaxNode,
  make_pretty: boolean
) => {
  if (!make_pretty) {
    view.dispatch({
      changes: {
        from: index,
        to: index,
        insert: extension_node
          ? extension + ' '
          : 'extensions [' + extension + ']\n',
      },
    });
  } else {
    let anchor = view.state.selection.main.anchor;
    let head = view.state.selection.main.head;
    if (extension_node) {
      view.dispatch({
        changes: {
          from: index,
          to: index,
          insert: extension + ' ',
        },
        selection: EditorSelection.create(
          [
            EditorSelection.range(
              extension_node.from,
              extension_node.to + (extension + ' ').length
            ),
          ],
          0
        ),
      });
    } else {
      view.dispatch({
        changes: {
          from: index,
          to: index,
          insert: 'extensions [' + extension + ']\n',
        },
        selection: EditorSelection.create(
          [
            EditorSelection.range(
              0,
              ('extensions [' + extension + ']\n').length
            ),
          ],
          0
        ),
      });
    }
    prettify(view);
    view.dispatch({ selection: { anchor: anchor, head: head } });
  }
};
