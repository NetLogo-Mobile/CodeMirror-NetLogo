import { ExternalTokenizer } from '@lezer/lr';

import { directives, turtleVars, patchVars, linkVars, constants } from './keywords';

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
} from './lang.terms.js';

import { PrimitiveManager } from './primitives/primitives';
import { GetContext } from './netlogo';
import { MatchBreed } from './parsers/breed';

let primitives = PrimitiveManager;

// Keyword tokenizer
export const keyword = new ExternalTokenizer((input, stack) => {
  let token = '';
  // Find until the token is complete
  while (isValidKeyword(input.next)) {
    token += String.fromCharCode(input.next);
    input.advance();
  }
  if (token == '') return;
  token = token.toLowerCase();
  // Find if the token belongs to any category
  // When these were under the regular tokenizer, they matched to word parts rather than whole words
  if (stack.context.extensionsGlobals || stack.context.procedureName < 2) {
    input.acceptToken(Identifier);
    return;
  }

  if (token == 'set') {
    input.acceptToken(Set);
  } else if (token == 'let') {
    input.acceptToken(Let);
  } else if (token == 'to' || token == 'to-report') {
    input.acceptToken(To);
  } else if (token == 'end') {
    input.acceptToken(End);
  } else if (token == 'and' || token == 'or' || token == 'xor') {
    input.acceptToken(AndOr);
  } else if (token == 'globals') {
    input.acceptToken(GlobalStr);
  } else if (token == 'extensions') {
    input.acceptToken(ExtensionStr);
  } else if (token == 'foreach') {
    input.acceptToken(APCommand);
  } else if (token == 'n-values') {
    input.acceptToken(APReporterFlip);
  } else if (token == 'map') {
    input.acceptToken(APReporterVar);
  } else if (token == 'reduce' || token == 'filter' || token == 'sort-by') {
    input.acceptToken(APReporter);
  } else if (
    [
      '+',
      '*',
      '/',
      '^',
      '=',
      '!=',
      '>',
      '<',
      '<=',
      '>=',
      'and',
      'or',
      'mod',
      'in-radius',
      'at-points',
      'of',
      'with',
      'with-max',
      'with-min',
    ].indexOf(token) > -1
  ) {
    input.acceptToken(ReporterLeft1Args);
  } else if (token == '-') {
    input.acceptToken(ReporterLeft1ArgsOpt);
  } else if (token == 'in-cone') {
    input.acceptToken(ReporterLeft2Args);
  } else if (token == '-' || token == '+') {
    input.acceptToken(PlusMinus);
  } else if (token == 'breed') {
    let offset = 0;
    let foundText = false;
    let seenBracket = false;
    let nextToken = '';
    while (offset < 100 && (isValidKeyword(input.peek(offset)) || !foundText)) {
      if (isValidKeyword(input.peek(offset))) {
        nextToken += String.fromCharCode(input.peek(offset));
        foundText = true;
      } else if (input.peek(offset) == 91) {
        seenBracket = true;
      }
      offset++;
    }
    if (seenBracket && [...GetContext().PluralBreeds.keys()].includes(nextToken.toLowerCase())) {
      input.acceptToken(BreedStr);
    } else {
      input.acceptToken(BreedToken);
    }
  } else if (token == 'directed-link-breed' || token == 'undirected-link-breed') {
    input.acceptToken(BreedStr);
  } else if (directives.indexOf(token) != -1) {
    input.acceptToken(Directive);
  } else if (turtleVars.indexOf(token) != -1) {
    input.acceptToken(TurtleVar);
  } else if (patchVars.indexOf(token) != -1) {
    input.acceptToken(PatchVar);
  } else if (linkVars.indexOf(token) != -1) {
    input.acceptToken(LinkVar);
  } else if (constants.indexOf(token) != -1) {
    input.acceptToken(Constant);
  } else {
    // Check if token is a reporter/commander
    const primitive = PrimitiveManager.GetNamedPrimitive(token);
    if (primitive != null) {
      if (PrimitiveManager.IsReporter(primitive)) {
        input.acceptToken(Reporter);
      } else {
        input.acceptToken(Command);
      }
      return;
    }

    // Check if token is a breed reporter/command
    const match = MatchBreed(token, GetContext());
    if (match.Tag != 0 && match.Valid) {
      input.acceptToken(match.Tag);
      return;
    }

    // Check if token is a custom procedure
    const customMatch = matchCustomProcedure(token);
    if (customMatch != 0) {
      input.acceptToken(customMatch);
      return;
    } else if (match.Tag != 0) {
      input.acceptToken(match.Tag);
    } else if (token.indexOf(':') != -1 && primitives.GetExtensions().indexOf(token.split(':')[0]) == -1) {
      input.acceptToken(UnsupportedPrim);
    } else {
      input.acceptToken(Identifier);
    }
  }
});

// Check if the character is valid for a keyword.
// JC: For performance, can we turn this into a Bool[256] that requires O(1) to check?
export function isValidKeyword(ch: number) {
  return (
    ch >= 160 || // Unicode characters
    ch == 35 || //#
    ch == 33 || // !
    ch == 37 || // %
    ch == 39 || // '
    ch == 63 || // ?
    // 0-9
    (ch >= 42 && ch <= 58) ||
    // -
    ch == 45 ||
    ch == 94 ||
    // _
    ch == 95 ||
    // A-Z
    (ch >= 60 && ch <= 90) ||
    ch == 94 ||
    ch == 95 ||
    // a-z
    (ch >= 97 && ch <= 122)
  );
}

/** matchCustomProcedure: Check if the token is a custom procedure. */
function matchCustomProcedure(token: string) {
  let parseContext = GetContext();
  if (parseContext.Commands.has(token)) return SpecialCommand;
  if (parseContext.Reporters.has(token)) return SpecialReporter;
  return 0;
}
