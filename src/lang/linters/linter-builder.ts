import { Diagnostic, linter } from '@codemirror/lint';
import { EditorView, logException } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import {
  stateExtension,
  StateNetLogo,
} from '../../codemirror/extension-state-netlogo';

const buildLinter = function (
  Source: (view: EditorView, parseState: StateNetLogo) => Diagnostic[]
): Extension {
  var LastVersion = 0;
  var Cached: Diagnostic[];
  return linter((view: EditorView) => {
    const State = view.state.field(stateExtension);
    if (State.GetDirty() || State.GetVersion() > LastVersion) {
      State.ParseState(view.state);
      Cached = Source(view, State);
      LastVersion = State.GetVersion();
    }
    return Cached;
  });
};

export { buildLinter };
