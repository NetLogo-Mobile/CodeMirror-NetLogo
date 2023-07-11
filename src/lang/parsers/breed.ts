import { BreedType } from '../classes/structures';
import { GetContext } from '../netlogo';

import {
  Set,
  Let,
  To,
  End,
  Directive,
  Command,
  Reporter,
  TurtleVar,
  PatchVar,
  LinkVar,
  Constant,
  Identifier,
  Own,
  GlobalStr,
  ExtensionStr,
  BreedStr,
  ReporterLeft1Args,
  ReporterLeft2Args,
  ReporterLeft1ArgsOpt,
  PlusMinus,
  SpecialCommand,
  SpecialReporter,
  BreedToken,
  AndOr,
  APCommand,
  APReporterFlip,
  APReporterVar,
  APReporter,
  UnsupportedPrim,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
} from './../lang.terms.js';

/** breedStatementRules: Rules for matching breed statements. */
// For Ruth: You might want to merge the "BreedLocation" into those rules and then refactor relevant procedures into this file.
const breedStatementRules = [
  {
    Match: /^(.*?)-own$/,
    Singular: false,
    Tag: Own,
    Type: undefined,
    Position: 0,
  },
  {
    Match: /^(.*?)-(at|here|on)$/,
    Singular: false,
    Tag: SpecialReporter,
    Type: BreedType.Turtle,
    Position: 0,
  },
  {
    Match: /^(.*?)-(with|neighbor\?|neighbors)$/,
    Singular: true,
    Tag: SpecialReporter,
    Type: BreedType.UndirectedLink,
  },
  {
    Match: /^(?:my-in|my-out)-(.*?)$/,
    Singular: false,
    Tag: SpecialReporter,
    Type: BreedType.UndirectedLink,
  },
  {
    Match: /^(?:hatch|sprout|create|create-ordered)-(.*?)$/,
    Singular: false,
    Tag: SpecialCommand,
    Type: BreedType.Turtle,
  },
  {
    Match: /^is-(.*?)\?$/,
    Singular: true,
    Tag: SpecialReporter,
    Type: undefined,
  },
  {
    Match: /^in-(.*?)-from\?$/,
    Singular: true,
    Tag: SpecialReporter,
    Type: BreedType.UndirectedLink,
  },
  {
    Match: /^out-(.*?)-to\?$/,
    Singular: true,
    Tag: SpecialReporter,
    Type: BreedType.UndirectedLink,
  },
  {
    Match: /^create-(.*?)-(?:to|from|with)$/,
    Singular: true,
    Tag: SpecialCommand,
    Type: BreedType.UndirectedLink,
  },
];

/** matchBreed: Check if the token is a breed reporter/command/variable. */
export function matchBreed(token: string) {
  let tag = 0;
  let parseContext = GetContext();

  // Check breed variables
  let breedVars = parseContext.BreedVars;
  if (breedVars.has(token)) return { tag: Identifier, valid: false };

  // Check breed statements
  for (let rule of breedStatementRules) {
    let match = token.match(rule.Match);
    if (match) {
      var name = match[1];
      var type = -1;
      var typeConstrained = rule.Type !== undefined;
      if (rule.Singular) {
        if (!parseContext.SingularBreeds.has(name)) return { tag: 0, valid: false };
        if (typeConstrained) type = parseContext.BreedTypes.get(parseContext.SingularToPlurals.get(name)!)!;
      } else {
        if (!parseContext.PluralBreeds.has(name)) return { tag: 0, valid: false };
        if (typeConstrained) type = parseContext.BreedTypes.get(name)!;
      }
      if (type == BreedType.DirectedLink) type = BreedType.UndirectedLink;
      if (typeConstrained && type !== rule.Type) return { tag: 0, valid: false };
      return { tag: rule.Tag, valid: true };
    }
  }

  return { tag: 0, valid: false };
}
