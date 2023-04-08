import { Breed } from '../../lang/classes';
import { EditorState } from '@codemirror/state';
/** classifyPrimitive: Identify type of reporter/command for appropriate tooltip. */
export declare const classifyPrimitive: (name: string) => string;
/** classifyBreedName: Identify if breed name is plural or singular. */
export declare const classifyBreedName: (term: string, breeds: Breed[]) => string;
/** getLink: Identify internal link for tooltips (e.g. creation of variable). */
export declare const getLink: (nodeName: string, childName: string, term: string, state: EditorState) => {
    to: number;
    from: number;
    hasLink: boolean;
};
