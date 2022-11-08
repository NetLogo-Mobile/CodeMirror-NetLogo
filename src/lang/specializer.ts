import { REPORTERS } from './reporters';

import {
  ReportersAll,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
} from './lang.terms.js';

const specializeReporter = function (token: string) {
  token = token.toLowerCase();
  return ReportersAll;
};

export { specializeReporter };
