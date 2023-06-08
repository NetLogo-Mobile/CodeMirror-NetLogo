import { BreedLocation } from '../lang/classes/structures';
/** getBreedName: Parse the breed primitive for breed name. */
export declare const getBreedName: (value: string) => {
    breed: string;
    isPlural: boolean;
    isLink: boolean;
};
/** checkBreedLike: Identify if an identifier looks like a breed procedure,
 and where the breed name is inside that identifier **/
export declare const checkBreedLike: (str: string) => {
    found: boolean;
    location: BreedLocation;
    isPlural: boolean;
    isLink: boolean;
};
/** getPluralName: Get the plural name of a breed. */
export declare const getPluralName: (singular: string) => string;
/** getSingularName: Get the singular name of a breed. */
export declare const getSingularName: (plural: string) => string;
//# sourceMappingURL=breed-utils.d.ts.map