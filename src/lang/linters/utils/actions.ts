import { EditorView } from 'codemirror';
import { Localized } from '../../../editor';
import { BreedType } from '../../classes/structures';
import { CodeEditing } from '../../services/code-editing';

/** AddBreedAction: Return an add a breed action. */
export const AddBreedAction = function (type: BreedType, plural: string, singular: string) {
  return {
    name: Localized.Get('Add'),
    apply(view: EditorView, from: number, to: number) {
      new CodeEditing(view).AppendBreed(type, plural, singular);
    },
  };
};

/** AddGlobalsAction: Return an add a global action. */
export const AddGlobalsAction = function (type: 'Globals' | 'Extensions', items: string[]) {
  return {
    name: Localized.Get('Add'),
    apply(view: EditorView, from: number, to: number) {
      new CodeEditing(view).AppendGlobals(type, items);
    },
  };
};
