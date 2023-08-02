import { LintContext, PreprocessContext } from '../classes/contexts';
import { Breed, BreedType, AgentContexts } from '../classes/structures';
/** BreedStatementRules: Rules for matching breed statements. */
export declare const BreedStatementRules: BreedStatementRule[];
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
    /** String: String representation of the rule. */
    String: string[];
    /** Context: Context of the rule. */
    Context: AgentContexts;
    /** isCommand: Is the rule a command? */
    isCommand: boolean;
}
/** BreedMatch: A match for a breed. */
export interface BreedMatch {
    /** Tag: The tag of the token. */
    Tag: number;
    /** Valid: Whether the match is validated. */
    Valid: boolean;
    /** Singular: The singular form of the breed. */
    Singular?: string;
    /** Plural: The plural form of the breed. */
    Plural?: string;
    /** Type: The type of the breed. */
    Type?: BreedType;
    /** Rule: The rule that matched. */
    Rule?: BreedStatementRule;
    /** Prototype: The prototype of the token. */
    Prototype?: string;
    /** Context: The context of the token. */
    Context?: AgentContexts;
}
/** MatchBreed: Check if the token is a breed reporter/command/variable. */
export declare function MatchBreed(token: string, context: PreprocessContext, guessing?: boolean): BreedMatch;
/** GetAllBreedPrimitives: Get all breed primitives. */
export declare function GetAllBreedPrimitives(lintContext: LintContext): string[];
/** GetBreedPrimitives: Get primitives for a specific breed. */
export declare function GetBreedPrimitives(b: Breed): string[];
/** getPluralName: Get the plural name of a breed. */
export declare const getPluralName: (singular: string) => string;
/** getSingularName: Get the singular name of a breed. */
export declare const getSingularName: (plural: string) => string;
//# sourceMappingURL=breed.d.ts.map