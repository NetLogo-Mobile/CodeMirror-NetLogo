import { ParseContext } from '@codemirror/language';
import { preprocessStateExtension } from '../codemirror/extension-state-preprocess.js';
import {
  Reporter0Args,
  Reporter1Args,
  Reporter2Args,
  Reporter3Args,
  Reporter4Args,
  Reporter5Args,
  Reporter6Args,
  Reporter0ArgsVar,
  Reporter1ArgsVar,
  Reporter2ArgsVar,
  Reporter3ArgsVar,
  Reporter4ArgsVar,
  Reporter5ArgsVar,
  Reporter6ArgsVar,
  Reporter1ArgsVar0,
  Reporter2ArgsVar0,
  SpecialReporter0Args,
  SpecialReporter1Args,
  SpecialReporter2Args,
  SpecialReporter3Args,
  SpecialReporter4Args,
  SpecialReporter5Args,
  SpecialReporter6Args,
  SpecialReporter1ArgsBoth,
  SpecialReporter0ArgsLink,
  SpecialReporter1ArgsLink,
  SpecialReporter2ArgsTurtle,
  SpecialReporter0ArgsTurtle,
  SpecialReporter1ArgsTurtle,
  SpecialReporter0ArgsLinkP,
  Command0Args,
  Command1Args,
  Command2Args,
  Command3Args,
  Command4Args,
  Command5Args,
  Command6Args,
  Command0ArgsVar,
  Command1ArgsVar,
  Command2ArgsVar,
  Command3ArgsVar,
  Command4ArgsVar,
  Command5ArgsVar,
  Command6ArgsVar,
  Command3ArgsVar2,
  SpecialCommand0Args,
  SpecialCommand1Args,
  SpecialCommand2Args,
  SpecialCommand3Args,
  SpecialCommand4Args,
  SpecialCommand5Args,
  SpecialCommand6Args,
  SpecialCommandCreateTurtle,
  SpecialCommandCreateLink,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
} from './lang.terms.js';
import { PrimitiveManager } from './primitives/primitives';

let primitives = PrimitiveManager;
const specializeReporter = function (token: string) {
  token = token.toLowerCase();

  if (
    token == 'se' ||
    token == 'list' ||
    token == 'sentence' ||
    token == 'word'
  ) {
    return Reporter2ArgsVar0;
  } else if (
    token == 'patch-set' ||
    token == 'link-set' ||
    token == 'turtle-set'
  ) {
    return Reporter1ArgsVar0;
  }

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
    if (repeats) {
      if (args == 0) {
        return Reporter0ArgsVar;
      } else if (args == 1) {
        return Reporter1ArgsVar;
      } else if (args == 2) {
        return Reporter2ArgsVar;
      } else if (args == 3) {
        return Reporter3ArgsVar;
      } else if (args == 4) {
        return Reporter4ArgsVar;
      } else if (args == 5) {
        return Reporter5ArgsVar;
      } else if (args == 6) {
        return Reporter6ArgsVar;
      }
    } else {
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
  if (token == 'patch' || token == 'link') {
    return SpecialReporter2Args;
  } else if (singularBreedNames.includes(token)) {
    return SpecialReporter1Args;
  }

  if (token.match(/[^\s]+-(at)/)) {
    return SpecialReporter2ArgsTurtle;
  } else if (token.match(/[^\s]+-here/)) {
    return SpecialReporter0ArgsTurtle;
  } else if (token.match(/[^\s]+-neighbors/)) {
    return SpecialReporter0ArgsLink;
  } else if (token.match(/[^\s]+-on/)) {
    return SpecialReporter1ArgsTurtle;
  } else if (token.match(/[^\s]+-(with|neighbor\\?)/)) {
    return SpecialReporter1ArgsLink;
  } else if (token.match(/^(my|my-in|my-out)-[^\s]+/)) {
    return SpecialReporter0ArgsLinkP;
  } else if (token.match(/^is-[^\s]+\\?$/)) {
    return SpecialReporter1ArgsBoth;
  } else if (token.match(/^in-[^\s]+-from$/)) {
    return SpecialReporter1ArgsLink;
  } else if (token.match(/^(in|out)-[^\s]+-(neighbors)$/)) {
    return SpecialReporter0ArgsLink;
  } else if (token.match(/^(in|out)-[^\s]+-(neighbor\\?)$/)) {
    return SpecialReporter1ArgsLink;
  } else if (token.match(/^out-[^\s]+-to$/)) {
    return SpecialReporter1ArgsLink;
  } else {
    return -1;
  }
};

const specializeCommand = function (token: string) {
  token = token.toLowerCase();

  if (token == 'ifelse' || token == 'if-else') {
    return Command3ArgsVar2;
  }

  let commands = primitives.GetPrimitive('', token);
  if (commands) {
    let repeats = false;
    let args = commands?.RightArgumentTypes.length;
    commands.RightArgumentTypes.map((arg) => {
      if (arg.CanRepeat) {
        repeats = true;
        if (commands?.DefaultOption) {
          args = commands?.DefaultOption;
        }
      }
    });
    if (repeats) {
      if (args == 0) {
        return Command0ArgsVar;
      } else if (args == 1) {
        return Command1ArgsVar;
      } else if (args == 2) {
        return Command2ArgsVar;
      } else if (args == 3) {
        return Command3ArgsVar;
      } else if (args == 4) {
        return Command4ArgsVar;
      } else if (args == 5) {
        return Command5ArgsVar;
      } else if (args == 6) {
        return Command6ArgsVar;
      }
    } else {
      if (args == 0) {
        return Command0Args;
      } else if (args == 1) {
        return Command1Args;
      } else if (args == 2) {
        return Command2Args;
      } else if (args == 3) {
        return Command3Args;
      } else if (args == 4) {
        return Command4Args;
      } else if (args == 5) {
        return Command5Args;
      } else if (args == 6) {
        return Command6Args;
      }
    }
  } else {
    return -1;
  }
};

const specializeSpecialCommand = function (token: string) {
  token = token.toLowerCase();
  let parseContext = ParseContext.get();
  let commands =
    parseContext?.state.field(preprocessStateExtension).Commands ?? {};
  if (commands[token] >= 0) {
    let args = commands[token];
    if (args == 0) {
      return SpecialCommand0Args;
    } else if (args == 1) {
      return SpecialCommand1Args;
    } else if (args == 2) {
      return SpecialCommand2Args;
    } else if (args == 3) {
      return SpecialCommand3Args;
    } else if (args == 4) {
      return SpecialCommand4Args;
    } else if (args == 5) {
      return SpecialCommand5Args;
    } else if (args == 6) {
      return SpecialCommand6Args;
    } else {
      return -1;
    }
  }

  if (token.match(/^create-[^\s]+-(to|from|with)$/)) {
    return SpecialCommandCreateLink;
  } else if (token.match(/^(hatch|sprout|create|create-ordered)-[^\s]+/)) {
    return SpecialCommandCreateTurtle;
  } else {
    return -1;
  }
};

export {
  specializeReporter,
  specializeSpecialReporter,
  specializeCommand,
  specializeSpecialCommand,
};
