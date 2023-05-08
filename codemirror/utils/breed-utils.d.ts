import { BreedLocation } from '../../lang/classes/structures';
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
export declare const otherBreedName: (breed: string, isPlural: boolean) => string;
//# sourceMappingURL=breed-utils.d.ts.map