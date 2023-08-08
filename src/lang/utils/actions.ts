import { EditorView } from '@codemirror/view';
import { Diagnostic } from '@codemirror/lint';
import { Localized } from '../../editor';
import { BreedType } from '../classes/structures';
import { CodeEditing } from '../services/code-editing';
import { getNodeContext } from './code';
import { syntaxTree } from '@codemirror/language';

/** addBreedAction: Add an adding a breed action. */
export const addBreedAction = function (
  diagnostic: Diagnostic,
  type: BreedType,
  plural: string,
  singular: string
): Diagnostic {
  diagnostic.actions = [
    ...(diagnostic.actions ?? []),
    {
      name: Localized.Get('Add'),
      apply(view: EditorView, from: number, to: number) {
        new CodeEditing(view).AppendBreed(type, plural, singular);
      },
    },
  ];
  return diagnostic;
};

/** addGlobalsAction: Add an adding global variables action. */
export const addGlobalsAction = function (
  diagnostic: Diagnostic,
  type: 'Globals' | 'Extensions',
  items: string[]
): Diagnostic {
  diagnostic.actions = [
    ...(diagnostic.actions ?? []),
    {
      name: Localized.Get('Add'),
      apply(view: EditorView, from: number, to: number) {
        new CodeEditing(view).AppendGlobals(type, items);
      },
    },
  ];
  return diagnostic;
};

/** removeAction: Add an removing the snippet action. */
export const removeAction = function (diagnostic: Diagnostic): Diagnostic {
  diagnostic.actions = [
    ...(diagnostic.actions ?? []),
    {
      name: Localized.Get('Remove'),
      apply(view: EditorView, from: number, to: number) {
        view.dispatch({ changes: { from, to, insert: '' } });
      },
    },
  ];
  return diagnostic;
};

/** removeAction: Add an removing the snippet action. */
export const AddReplaceAction = function (diagnostic: Diagnostic, replacement: string): Diagnostic {
  diagnostic.actions = [
    ...(diagnostic.actions ?? []),
    {
      name: Localized.Get('Replace'),
      apply(view: EditorView, from: number, to: number) {
        view.dispatch({ changes: { from, to, insert: replacement } });
      },
    },
  ];
  return diagnostic;
};

/** explainAction: Add an explain the linting message action. */
export const explainAction = function (
  diagnostic: Diagnostic,
  callback: (Diagnostic: Diagnostic, Context: string) => void
): Diagnostic {
  diagnostic.actions = [
    ...(diagnostic.actions ?? []),
    {
      name: Localized.Get('Explain'),
      apply(view: EditorView, from: number, to: number) {
        var node = syntaxTree(view.state).resolve(from, -1);
        callback(diagnostic, getNodeContext(view.state, node)!);
      },
    },
  ];
  return diagnostic;
};
