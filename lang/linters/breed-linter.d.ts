import { SyntaxNode } from '@lezer/common';
import { Linter } from './linter-builder';
import { Breed } from '../classes/structures';
import { CheckContext } from '../utils/check-identifier';
export declare const BreedLinter: Linter;
export declare const checkValidBreed: (node: SyntaxNode, value: string, context: CheckContext, breeds: Breed[]) => {
    isValid: boolean;
    isPlural: boolean;
    isLink: boolean;
    newBreed: boolean;
};
//# sourceMappingURL=breed-linter.d.ts.map