import { BreedType } from '../classes/structures';
/** BreedStatementRule: A rule for matching breed statements. */
export interface BreedStatementRule {
    /** Match: The regular expression for the rule. */
    Match: RegExp;
    /** Tag: The tag of the token. */
    Tag: number;
    /** Singular: Is the fill-in breed singular? */
    Singular: boolean | undefined;
    /** Type: Type for the fill-in breed. */
    Type: BreedType | undefined;
    /** Position: Position of the match group. */
    Position: number;
}
/** BreedMatch: A match for a breed. */
export interface BreedMatch {
    /** Tag: The tag of the token. */
    Tag: number;
    /** Valid: Whether the match is validated. */
    Valid: boolean;
    /** Rule: The rule that matched. */
    Rule?: BreedStatementRule;
    /** Prototype: The prototype of the token. */
    Prototype?: string;
}
/** MatchBreed: Check if the token is a breed reporter/command/variable. */
export declare function MatchBreed(token: string): BreedMatch;
//# sourceMappingURL=breed.d.ts.map