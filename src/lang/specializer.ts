import {
  ReportersAll,
  ReporterVarArgs,
  Reporter0Args,
  Reporter1Args,
  Reporter2Args,
  Reporter3Args,
  Reporter4Args,
  Reporter5Args,
  Reporter6Args,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
} from './lang.terms.js';
import { PrimitiveManager } from './primitives/primitives';

let primitives = PrimitiveManager;
const specializeReporter = function (token: string) {
  token = token.toLowerCase();
  let reporter = primitives.GetPrimitive('', token);
  if (reporter) {
    let repeats = false;
    let args = reporter?.RightArgumentTypes.length;
    reporter.RightArgumentTypes.map((arg) => {
      if (arg.CanRepeat) {
        repeats = true;
        if (reporter?.DefaultOption) {
          args = reporter?.DefaultOption;
        }
      }
    });
    // if (repeats) {
    //     return ReporterVarArgs
    // }
    if (args == 0) {
      return Reporter0Args;
    } else if (args == 1) {
      return Reporter1Args;
    } else if (args == 2) {
      return Reporter2Args;
    } else if (args == 3) {
      return Reporter3Args;
    } else if (args == 4) {
      return Reporter4Args;
    } else if (args == 5) {
      return Reporter5Args;
    } else if (args == 6) {
      return Reporter6Args;
    }
  }

  return -1;
};

export { specializeReporter };
