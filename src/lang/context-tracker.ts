import { ContextTracker } from '@lezer/lr';
import { isValidKeyword } from './tokenizer';

// let globalStatements=true

export const contextTracker = new ContextTracker({
  //false,
  start: {
    extensionsGlobals: false,
    globalStatement: true,
    procedureName: 2,
  },
  shift: (context, term, stack, input) => {
    let globalStatements = input.pos == 0 ? true : context.globalStatement;
    let procedureName =
      context.procedureName < 2
        ? context.procedureName + 1
        : context.procedureName;
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
        procedureName: 0,
      };
    }
    return {
      extensionsGlobals: context.extensionsGlobals,
      globalStatement: globalStatements,
      procedureName: procedureName,
    };
  },
});
