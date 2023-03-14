import { ExternalTokenizer } from '@lezer/lr';

import {
  directives,
  turtleVars,
  patchVars,
  linkVars,
  constants,
  unsupported,
} from './keywords';

import {
  Set,
  Let,
  To,
  End,
  Directive,
  Command,
  Extension,
  Reporter,
  TurtleVar,
  PatchVar,
  LinkVar,
  Constant,
  Unsupported,
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
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
} from './lang.terms.js';

import { ParseContext } from '@codemirror/language';
import { preprocessStateExtension } from '../codemirror/extension-state-preprocess';
import { PrimitiveManager } from './primitives/primitives';

// Keyword tokenizer
export const keyword = new ExternalTokenizer((input) => {
  let token = '';
  // Find until the token is complete
  while (isValidKeyword(input.next)) {
    token += String.fromCharCode(input.next).toLowerCase();
    input.advance();
  }
  if (token == '') return;
  token = token.toLowerCase();
  // Find if the token belongs to any category
  // When these were under the regular tokenizer, they matched to word parts rather than whole words
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
    input.acceptToken(BreedToken);
  } else if (
    token == 'directed-link-breed' ||
    token == 'undirected-link-breed'
  ) {
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
  } else if (unsupported.indexOf(token) != -1) {
    input.acceptToken(Unsupported);
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
    const match = matchBreed(token);
    if (match != 0) {
      input.acceptToken(match);
      return;
    }
    // Check if token is a custom procedure
    const customMatch = matchCustomProcedure(token);
    if (customMatch != 0) {
      input.acceptToken(customMatch);
    } else {
      input.acceptToken(Identifier);
    }
  }
});

// Check if the character is valid for a keyword.
// JC: For performance, can we turn this into a Bool[256] that requires O(1) to check?
function isValidKeyword(ch: number) {
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

// JC: Two issues with this approach: first, CJK breed names won't work; second, you can potentially do /\w+-(own|at|here)/ without doing many times
// checks if token is a breed command/reporter. For some reason 'or' didn't work here, so they're all separate
function matchBreed(token: string) {
  let tag = 0;
  let parseContext = ParseContext.get();
  let pluralBreedNames =
    parseContext?.state.field(preprocessStateExtension).PluralBreeds ?? [];
  let singularBreedNames =
    parseContext?.state.field(preprocessStateExtension).SingularBreeds ?? [];
  let breedVars =
    parseContext?.state.field(preprocessStateExtension).BreedVars ?? [];
  if (breedVars.includes(token.toLowerCase())) {
    tag = Identifier;
    return tag;
  }
  let foundMatch = false;
  let matchedBreed = '';
  let isSingular = false;
  for (let b of pluralBreedNames) {
    if (
      token.toLowerCase().includes(b.toLowerCase()) &&
      b.length > matchedBreed.length
    ) {
      foundMatch = true;
      matchedBreed = b;
      isSingular = false;
    }
  }
  for (let b of singularBreedNames) {
    if (
      token.toLowerCase().includes(b.toLowerCase()) &&
      b.length > matchedBreed.length
    ) {
      foundMatch = true;
      matchedBreed = b;
      isSingular = true;
    }
  }
  // console.log(token,matchedBreed,breedNames)
  if (!foundMatch) {
    return tag;
  }
  if (
    parseContext?.state
      .field(preprocessStateExtension)
      .SingularBreeds.includes(token)
  ) {
    tag = SpecialReporter;
  } else if (
    token.match(new RegExp(`^${matchedBreed}-own$`, 'i')) &&
    !isSingular
  ) {
    tag = Own;
  } else if (
    token.match(new RegExp(`^${matchedBreed}-(at|here|on)$`, 'i')) &&
    !isSingular
  ) {
    tag = SpecialReporter;
  } else if (
    token.match(
      new RegExp(`^${matchedBreed}-(with|neighbor\\?|neighbors)$`, 'i')
    ) &&
    isSingular
  ) {
    tag = SpecialReporter;
  } else if (
    token.match(new RegExp(`^(my-in|my-out)-${matchedBreed}$`, 'i')) &&
    !isSingular
  ) {
    tag = SpecialReporter;
  } else if (
    token.match(
      new RegExp(`^(hatch|sprout|create|create-ordered)-${matchedBreed}$`, 'i')
    ) &&
    !isSingular
  ) {
    tag = SpecialCommand;
  } else if (
    token.match(new RegExp(`^is-${matchedBreed}\\?$`, 'i')) &&
    isSingular
  ) {
    tag = SpecialReporter;
  } else if (
    token.match(new RegExp(`^in-${matchedBreed}-from$`, 'i')) &&
    isSingular
  ) {
    tag = SpecialReporter;
  } else if (
    token.match(
      new RegExp(`^(in|out)-${matchedBreed}-(neighbor\\?|neighbors)$`, 'i')
    ) &&
    isSingular
  ) {
    tag = SpecialReporter;
  } else if (
    token.match(new RegExp(`^out-${matchedBreed}-to$`, 'i')) &&
    isSingular
  ) {
    tag = SpecialReporter;
  } else if (
    token.match(new RegExp(`^create-${matchedBreed}-(to|from|with)$`, 'i'))
  ) {
    tag = SpecialCommand;
  }
  return tag;
}

function matchCustomProcedure(token: string) {
  let parseContext = ParseContext.get();
  let commands =
    parseContext?.state.field(preprocessStateExtension).Commands ?? {};
  let reporters =
    parseContext?.state.field(preprocessStateExtension).Reporters ?? {};
  // console.log(commands, reporters, token);
  if (commands[token] >= 0) {
    // console.log("found special command")
    return SpecialCommand;
  }
  if (reporters[token] >= 0) {
    return SpecialReporter;
  }
  return 0;
}
