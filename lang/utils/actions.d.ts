import { Diagnostic } from '@codemirror/lint';
import { BreedType } from '../classes/structures';
/** addBreedAction: Add an adding a breed action. */
export declare const addBreedAction: (diagnostic: Diagnostic, type: BreedType, plural: string, singular: string) => Diagnostic;
/** addGlobalsAction: Add an adding global variables action. */
export declare const addGlobalsAction: (diagnostic: Diagnostic, type: 'Globals' | 'Extensions', items: string[]) => Diagnostic;
/** RemoveAction: Add an removing the snippet action. */
export declare const removeAction: (diagnostic: Diagnostic) => Diagnostic;
//# sourceMappingURL=actions.d.ts.map