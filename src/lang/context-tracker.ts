import { ContextTracker } from '@lezer/lr';
import { isValidKeyword } from './tokenizer';

// let globalStatements=true

export const contextTracker = new ContextTracker({
  //false,
  start: {
    extensionsGlobals: false,
    globalStatement: true,
    procedureName: false,
  },
  shift: (context, term, stack, input) => {
    let globalStatements = true ? input.pos == 0 : context.globalStatement;
    let procedureName = false;
    let token = '';
    if (input.next == 93) {
      input.advance();
      // return false;
      return {
        extensionsGlobals: false,
        globalStatement: globalStatements,
        procedureName: procedureName,
      };
    }
    // Find until the token is complete
    while (isValidKeyword(input.next)) {
      token += String.fromCharCode(input.next).toLowerCase();
      input.advance();
    }
    token = token.toLowerCase();
    if (
      token == 'extensions' ||
      token == 'globals' ||
      token == 'breed' ||
      token == 'directed-link-breed' ||
      token == 'undirected-link-breed'
    ) {
      while (input.next == 32) {
        input.advance();
      }
      if (input.next == 91 && globalStatements) {
        // return true;
        return {
          extensionsGlobals: true,
          globalStatement: globalStatements,
          procedureName: procedureName,
        };
      }
    } else if (token == 'to' || token == 'to-report') {
      // globalStatements=false
      return {
        extensionsGlobals: context.extensionsGlobals,
        globalStatement: false,
        procedureName: true,
      };
    }
    return {
      extensionsGlobals: context.extensionsGlobals,
      globalStatement: globalStatements,
      procedureName: procedureName,
    };
  },
});
