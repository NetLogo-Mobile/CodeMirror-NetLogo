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
  ValFirstPrimitive,
  ValLastPrimitive,
  BreedFirst,
  BreedLast,
  BreedMiddle,
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
} from './lang.terms.js';

// Keyword tokenizer
export const keyword = new ExternalTokenizer((input) => {
  let token = '';
  // Find until the token is complete
  while (isValidKeyword(input.next)) {
    token += String.fromCharCode(input.next).toLowerCase();
    input.advance();
  }
  if (token == '') return;
  // Find if the token belongs to any category
  // Check if token is a breed reporter/command
  const match = matchBreed(token);
  // When these were under the regular tokenizer, they matched to word parts rather than whole words
  if (token == 'set') {
    input.acceptToken(Set);
  } else if (token == 'let') {
    input.acceptToken(Let);
  } else if (token == 'to' || token == 'to-report') {
    input.acceptToken(To);
  } else if (token == 'end') {
    input.acceptToken(End);
  } else if (token == 'foreach' || token == 'n-values') {
    input.acceptToken(ValFirstPrimitive);
  } else if (
    token == 'map' ||
    token == 'reduce' ||
    token == 'filter' ||
    token == 'sort-by'
  ) {
    input.acceptToken(ValLastPrimitive);
  } else if (directives.indexOf(token) != -1) {
    input.acceptToken(Directive);
  } else if (commands.indexOf(token) != -1) {
    input.acceptToken(Command);
  } else if (extensions.indexOf(token) != -1) {
    input.acceptToken(Extension);
  } else if (reporters.indexOf(token) != -1) {
    input.acceptToken(Reporter);
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
  } else if (match != 0) {
    input.acceptToken(match);
  } else {
    input.acceptToken(Identifier);
  }
});

// Check if the character is valid for a keyword.
function isValidKeyword(ch) {
  // 0-9
  return (
    (ch >= 48 && ch <= 58) ||
    // -
    ch == 45 ||
    // _
    ch == 95 ||
    // A-Z
    (ch >= 63 && ch <= 90) ||
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

// checks if token is a breed command/reporter. For some reason 'or' didn't work here, so they're all separate
function matchBreed(token) {
  let tag = 0;
  if (token.match(/\w+-own/)) {
    tag = Own;
  } else if (token.match(/\w+-at$/)) {
    tag = BreedFirst;
  } else if (token.match(/\w+-here$/)) {
    tag = BreedFirst;
  } else if (token.match(/\w+-on$/)) {
    tag = BreedFirst;
  } else if (token.match(/\w+-with$/)) {
    tag = BreedFirst;
  } else if (token.match(/\w+-neighbor\\?$/)) {
    tag = BreedFirst;
  } else if (token.match(/\w+-neighbors$/)) {
    tag = BreedFirst;
  } else if (token.match(/^create-\w+/)) {
    tag = BreedLast;
  } else if (token.match(/^my-in-\w+/)) {
    tag = BreedLast;
  } else if (token.match(/^my-out-\w+/)) {
    tag = BreedLast;
  } else if (token.match(/^create-ordered-\w+/)) {
    tag = BreedLast;
  } else if (token.match(/^hatch-\w+/)) {
    tag = BreedLast;
  } else if (token.match(/^sprout-\w+/)) {
    tag = BreedLast;
  } else if (token.match(/^is-\w+\\?$/)) {
    tag = BreedLast;
  } else if (token.match(/^in-\w+-neighbor\\?$/)) {
    tag = BreedMiddle;
  } else if (token.match(/^in-\w+-neighbors$/)) {
    tag = BreedMiddle;
  } else if (token.match(/^in-\w+-from$/)) {
    tag = BreedMiddle;
  } else if (token.match(/^out-\w+-neighbor\\?$/)) {
    tag = BreedMiddle;
  } else if (token.match(/^out-\w+-neighbors$/)) {
    tag = BreedMiddle;
  } else if (token.match(/^out-\w+-to$/)) {
    tag = BreedMiddle;
  } else if (token.match(/^create-\w+-to$/)) {
    tag = BreedMiddle;
  } else if (token.match(/^create-\w+-from$/)) {
    tag = BreedMiddle;
  } else if (token.match(/^create-\w+-with$/)) {
    tag = BreedMiddle;
  }
  return tag;
}
