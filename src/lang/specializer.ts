import { ParseContext } from '@codemirror/language';
import { preprocessStateExtension } from '../codemirror/extension-regex-state.js';
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
  SpecialReporter0Args,
  SpecialReporter1Args,
  SpecialReporter2Args,
  SpecialReporter3Args,
  SpecialReporter4Args,
  SpecialReporter5Args,
  SpecialReporter6Args,
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
  } else {
    return -1;
  }
};

const specializeSpecialReporter = function (token: string) {
  token = token.toLowerCase();

  let parseContext = ParseContext.get();
  let reporters =
    parseContext?.state.field(preprocessStateExtension).Reporters ?? {};
  if (reporters[token] >= 0) {
    let args = reporters[token];
    if (args == 0) {
      return SpecialReporter0Args;
    } else if (args == 1) {
      return SpecialReporter1Args;
    } else if (args == 2) {
      return SpecialReporter2Args;
    } else if (args == 3) {
      return SpecialReporter3Args;
    } else if (args == 4) {
      return SpecialReporter4Args;
    } else if (args == 5) {
      return SpecialReporter5Args;
    } else if (args == 6) {
      return SpecialReporter6Args;
    } else {
      return -1;
    }
  }

  let singularBreedNames =
    parseContext?.state.field(preprocessStateExtension).SingularBreeds ?? [];
  if (singularBreedNames.includes(token)) {
    return SpecialReporter1Args;
  }

  if (token.match(/[^\s]+-(at)/)) {
    return SpecialReporter2Args;
  } else if (token.match(/[^\s]+-(here|neighbors)/)) {
    return SpecialReporter0Args;
  } else if (token.match(/[^\s]+-(on|with|neighbor\\?)/)) {
    return SpecialReporter1Args;
  } else if (token.match(/^(my-in|my-out)-[^\s]+/)) {
    return SpecialReporter0Args;
  } else if (token.match(/^is-[^\s]+\\?$/)) {
    return SpecialReporter1Args;
  } else if (token.match(/^in-[^\s]+-from$/)) {
    return SpecialReporter1Args;
  } else if (token.match(/^(in|out)-[^\s]+-(neighbors)$/)) {
    return SpecialReporter0Args;
  } else if (token.match(/^(in|out)-[^\s]+-(neighbor\\?)$/)) {
    return SpecialReporter1Args;
  } else if (token.match(/^out-[^\s]+-to$/)) {
    return SpecialReporter1Args;
  } else {
    return -1;
  }
};

export { specializeReporter, specializeSpecialReporter };
