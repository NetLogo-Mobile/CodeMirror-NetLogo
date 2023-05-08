import { EditorView } from 'codemirror';
import { BreedType } from '../../classes/structures';
/** AddBreedAction: Return an add a breed action. */
export declare const AddBreedAction: (type: BreedType, plural: string, singular: string) => {
    name: any;
    apply(view: EditorView, from: number, to: number): void;
};
/** AddGlobalsAction: Return an add a global action. */
export declare const AddGlobalsAction: (type: 'Globals' | 'Extensions', items: string[]) => {
    name: any;
    apply(view: EditorView, from: number, to: number): void;
};
//# sourceMappingURL=actions.d.ts.map