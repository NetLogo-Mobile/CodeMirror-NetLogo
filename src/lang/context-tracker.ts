import { ContextTracker } from '@lezer/lr';
import { isValidKeyword } from './tokenizer';

export const contextTracker = new ContextTracker({
  start: false,
  shift: (context, term, stack, input) => {
    let token = '';
    if (input.next == 93) {
      input.advance();
      return false;
    }
    // Find until the token is complete
    while (isValidKeyword(input.next)) {
      token += String.fromCharCode(input.next).toLowerCase();
      input.advance();
    }
    token = token.toLowerCase();
    if (token == 'extensions' || token == 'globals') {
      //|| token=='directed-link-breed' || token == 'undirected-link-breed') {
      while (input.next == 32) {
        input.advance();
      }
      if (input.next == 91) {
        return true;
      }
    }
    return context;
  },
});
