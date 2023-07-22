import { BreedType } from '../classes/structures';
import { GetContext } from '../netlogo';

import {
  Own,
  Identifier,
  SpecialReporter0Args,
  SpecialReporter1Args,
  SpecialReporter2Args,
  SpecialReporter3Args,
  SpecialReporter4Args,
  SpecialReporter5Args,
  SpecialReporter6Args,
  SpecialReporter1ArgsBoth,
  SpecialReporter0ArgsLink,
  SpecialReporter1ArgsLink,
  SpecialReporter2ArgsTurtle,
  SpecialReporter0ArgsTurtle,
  SpecialReporter1ArgsTurtle,
  SpecialReporter0ArgsLinkP,
  SpecialCommand0Args,
  SpecialCommand1Args,
  SpecialCommand2Args,
  SpecialCommand3Args,
  SpecialCommand4Args,
  SpecialCommand5Args,
  SpecialCommand6Args,
  SpecialCommandCreateTurtle,
  SpecialCommandCreateLink,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
} from './../lang.terms.js';

/** BreedStatementRules: Rules for matching breed statements. */
// For Ruth: You might want to merge the "BreedLocation" into those rules and then refactor relevant procedures into this file.
const BreedStatementRules: BreedStatementRule[] = [
  {
    Match: /^(.*?)-own$/,
    Singular: false,
    Tag: Own,
    Type: undefined,
    Position: 0,
  },
  {
    Match: /^(.*?)-(at)$/,
    Singular: false,
    Tag: SpecialReporter2ArgsTurtle,
    Type: BreedType.Turtle,
    Position: 0,
  },
  {
    Match: /^(.*?)-(here)$/,
    Singular: false,
    Tag: SpecialReporter0ArgsTurtle,
    Type: BreedType.Turtle,
    Position: 0,
  },
  {
    Match: /^(.*?)-(on)$/,
    Singular: false,
    Tag: SpecialReporter1ArgsTurtle,
    Type: BreedType.Turtle,
    Position: 0,
  },
  {
    Match: /^(in)-(.*?)-(from)$/,
    Singular: true,
    Tag: SpecialReporter1ArgsLink,
    Type: BreedType.UndirectedLink,
    Position: 1,
  },
  {
    Match: /^(out)-(.*?)-(to)$/,
    Singular: true,
    Tag: SpecialReporter1ArgsLink,
    Type: BreedType.UndirectedLink,
    Position: 1,
  },
  {
    Match: /^(out|in)-(.*?)-(neighbor\?)$/,
    Singular: true,
    Tag: SpecialReporter1ArgsLink,
    Type: BreedType.UndirectedLink,
    Position: 1,
  },
  {
    Match: /^(out|in)-(.*?)-(neighbors)$/,
    Singular: true,
    Tag: SpecialReporter0ArgsLink,
    Type: BreedType.UndirectedLink,
    Position: 1,
  },
  {
    Match: /^(my-in|my-out|my)-(.*?)$/,
    Singular: false,
    Tag: SpecialReporter0ArgsLinkP,
    Type: BreedType.UndirectedLink,
    Position: 1,
  },
  {
    Match: /^(is)-(.*?)\?$/,
    Singular: true,
    Tag: SpecialReporter1ArgsBoth,
    Type: undefined,
    Position: 1,
  },
  {
    Match: /^(create)-(.*?)-(to|from|with)$/,
    Singular: undefined,
    Tag: SpecialCommandCreateLink,
    Type: BreedType.UndirectedLink,
    Position: 1,
  },
  {
    Match: /^(.*?)-(with|neighbor\?)$/,
    Singular: true,
    Tag: SpecialReporter1ArgsLink,
    Type: BreedType.UndirectedLink,
    Position: 0,
  },
  {
    Match: /^(.*?)-(neighbors)$/,
    Singular: true,
    Tag: SpecialReporter0ArgsLink,
    Type: BreedType.UndirectedLink,
    Position: 0,
  },
  {
    Match: /^(hatch|sprout|create-ordered|create)-(.*?)$/,
    Singular: false,
    Tag: SpecialCommandCreateTurtle,
    Type: BreedType.Turtle,
    Position: 1,
  },
];

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
export function MatchBreed(token: string): BreedMatch {
  let parseContext = GetContext();

  // Check breed variables
  let breedVars = parseContext.BreedVars;
  if (breedVars.has(token)) return { Tag: Identifier, Valid: false };
  if (parseContext.SingularBreeds.has(token)) {
    var Type = parseContext.BreedTypes.get(parseContext.SingularToPlurals.get(token)!);
    if (Type == BreedType.Turtle) return { Tag: SpecialReporter1Args, Valid: true };
    else return { Tag: SpecialReporter2Args, Valid: true };
  }

  // Check breed statements
  for (let rule of BreedStatementRules) {
    let match = token.match(rule.Match);
    if (match) {
      var name = match[rule.Position + 1];
      var type = -1;
      // Find the breed
      var singular = rule.Singular !== undefined ? rule.Singular : parseContext.SingularBreeds.has(name);
      if (singular) {
        if (!parseContext.SingularBreeds.has(name)) return { Tag: 0, Valid: false };
        type = parseContext.BreedTypes.get(parseContext.SingularToPlurals.get(name)!)!;
      } else {
        if (!parseContext.PluralBreeds.has(name)) return { Tag: 0, Valid: false };
        type = parseContext.BreedTypes.get(name)!;
      }
      if (type == BreedType.DirectedLink) type = BreedType.UndirectedLink;
      // Check the type
      if (rule.Type !== undefined && type !== rule.Type) return { Tag: 0, Valid: false };
      // Produce the prototype
      switch (type) {
        case BreedType.Turtle:
          match[rule.Position + 1] = singular ? 'turtle' : 'turtles';
          break;
        case BreedType.Patch:
          match[rule.Position + 1] = singular ? 'patch' : 'patches';
          break;
        case BreedType.UndirectedLink:
        case BreedType.DirectedLink:
          match[rule.Position + 1] = singular ? 'link' : 'links';
          break;
      }
      return { Rule: rule, Tag: rule.Tag, Valid: true, Prototype: match.slice(1).join('-') };
    }
  }

  return { Tag: 0, Valid: false };
}
