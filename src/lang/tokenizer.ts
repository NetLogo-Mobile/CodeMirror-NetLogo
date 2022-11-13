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
  And,
  Or,
  BreedFirstCommand,
  BreedLastCommand,
  BreedMiddleCommand,
  BreedFirstReporter,
  BreedLastReporter,
  BreedMiddleReporter,
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
  ReporterLeftArgs,
  PlusMinus,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
} from './lang.terms.js';

import { Reporters } from './primitives/reporters.js';
import { Commands } from './primitives/commands.js';
import { NetLogoType, Primitive } from './classes';

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
  } else if (token == 'and') {
    input.acceptToken(And);
  } else if (token == 'or') {
    input.acceptToken(Or);
  } else if (token == 'globals') {
    input.acceptToken(GlobalStr);
  } else if (token == 'extensions') {
    input.acceptToken(ExtensionStr);
  } else if (
    token == 'mod' ||
    token == 'in-radius' ||
    token == 'in-cone' ||
    token == 'at-points' ||
    token == 'of'
    // ["+","-","*","/","^","=","!=",">","<","<=",">=","and","or"].indexOf(token)>-1
  ) {
    input.acceptToken(ReporterLeftArgs);
  } else if (token == '-' || token == '+') {
    input.acceptToken(PlusMinus);
  } else if (
    token == 'breed' ||
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
      input.acceptToken(Identifier);
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
  if (token.match(/\w+-own/)) {
    tag = Own;
  } else if (token.match(/\w+-(at|here|on|with|neighbor\\?|neighbors)$/)) {
    tag = BreedFirstReporter;
  } else if (token.match(/^(my-in|my-out)-\w+/)) {
    tag = BreedLastReporter;
  } else if (token.match(/^(hatch|sprout|create|create-ordered)-\w+/)) {
    tag = BreedLastCommand;
  } else if (token.match(/^is-\w+\\?$/)) {
    tag = BreedLastReporter;
  } else if (token.match(/^in-\w+-from$/)) {
    tag = BreedMiddleReporter;
  } else if (token.match(/^(in|out)-\w+-(neighbor\\?|neighbors)$/)) {
    tag = BreedMiddleReporter;
  } else if (token.match(/^out-\w+-to$/)) {
    tag = BreedMiddleReporter;
  } else if (token.match(/^create-\w+-(to|from|with)$/)) {
    tag = BreedMiddleCommand;
  }
  return tag;
}
