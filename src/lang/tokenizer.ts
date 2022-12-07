import { ExternalTokenizer } from '@lezer/lr';

import {
  directives,
  commands,
  extensions,
  reporters,
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
  ReporterLeftArgs1,
  ReporterLeftArgs2,
  PlusMinus,
  SpecialCommand,
  SpecialReporter,
  BreedToken,
  AndOr,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
} from './lang.terms.js';

import { Reporters } from './primitives/reporters.js';
import { Commands } from './primitives/commands.js';
import { NetLogoType, Primitive } from './classes';
import { ParseContext } from '@codemirror/language';
import { preprocessStateExtension } from '../codemirror/extension-regex-state';

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
  // Check if token is a breed reporter/command
  // JC: Match should be done only when needed to booster the performance.

  // When these were under the regular tokenizer, they matched to word parts rather than whole words
  if (token == 'set') {
    input.acceptToken(Set);
  } else if (token == 'let') {
    input.acceptToken(Let);
  } else if (token == 'to' || token == 'to-report') {
    input.acceptToken(To);
  } else if (token == 'end') {
    input.acceptToken(End);
  } else if (token == 'and' || token == 'or') {
    input.acceptToken(AndOr);
  } else if (token == 'globals') {
    input.acceptToken(GlobalStr);
  } else if (token == 'extensions') {
    input.acceptToken(ExtensionStr);
  } else if (
    token == 'mod' ||
    token == 'in-radius' ||
    token == 'at-points' ||
    token == 'of' ||
    token == 'with' ||
    [
      '+',
      '-',
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
    ].indexOf(token) > -1
  ) {
    input.acceptToken(ReporterLeftArgs1);
  } else if (token == 'in-cone') {
    input.acceptToken(ReporterLeftArgs2);
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
  } else if (commands.indexOf(token) != -1) {
    input.acceptToken(Command);
  } else if (reporters.indexOf(token) != -1) {
    input.acceptToken(Reporter);
  } else if (extensions.indexOf(token) != -1) {
    input.acceptToken(Extension);
  } else {
    const match = matchBreed(token);
    if (match != 0) {
      input.acceptToken(match);
    } else {
      const customMatch = matchCustomProcedure(token);
      if (customMatch != 0) {
        input.acceptToken(customMatch);
      } else {
        input.acceptToken(Identifier);
      }
    }
  }
});

// Check if the character is valid for a keyword.
function isValidKeyword(ch: number) {
  return (
    ch == 33 ||
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
    (ch >= 97 && ch <= 122) ||
    // non-English characters
    (ch >= 128 && ch <= 154) ||
    (ch >= 160 && ch <= 165) ||
    (ch >= 181 && ch <= 183) ||
    (ch >= 210 && ch <= 216) ||
    (ch >= 224 && ch <= 237)
  );
}

// JC: Two issues with this approach: first, CJK breed names won't work; second, you can potentially do /\w+-(own|at|here)/ without doing many times
// checks if token is a breed command/reporter. For some reason 'or' didn't work here, so they're all separate
function matchBreed(token: string) {
  let tag = 0;
  let parseContext = ParseContext.get();
  let breedNames =
    parseContext?.state
      .field(preprocessStateExtension)
      .PluralBreeds.concat(
        parseContext?.state.field(preprocessStateExtension).SingularBreeds
      ) ?? [];
  let foundMatch = false;

  for (let b of breedNames) {
    if (token.includes(b)) {
      foundMatch = true;
    }
  }
  if (!foundMatch) {
    return tag;
  }
  if (
    parseContext?.state
      .field(preprocessStateExtension)
      .SingularBreeds.includes(token)
  ) {
    tag = SpecialReporter;
  } else if (token.match(/[^\s]+-own/)) {
    tag = Own;
  } else if (token.match(/[^\s]+-(at|here|on|with|neighbor\\?|neighbors)$/)) {
    tag = SpecialReporter;
  } else if (token.match(/^(my-in|my-out)-[^\s]+/)) {
    tag = SpecialReporter;
  } else if (token.match(/^(hatch|sprout|create|create-ordered)-[^\s]+/)) {
    tag = SpecialCommand;
  } else if (token.match(/^is-[^\s]+\\?$/)) {
    tag = SpecialReporter;
  } else if (token.match(/^in-[^\s]+-from$/)) {
    tag = SpecialReporter;
  } else if (token.match(/^(in|out)-[^\s]+-(neighbor\\?|neighbors)$/)) {
    tag = SpecialReporter;
  } else if (token.match(/^out-[^\s]+-to$/)) {
    tag = SpecialReporter;
  } else if (token.match(/^create-[^\s]+-(to|from|with)$/)) {
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
  console.log(commands, reporters, token);
  if (commands[token] >= 0) {
    // console.log("found special command")
    return SpecialCommand;
  }
  if (reporters[token] >= 0) {
    return SpecialReporter;
  }
  return 0;
}
