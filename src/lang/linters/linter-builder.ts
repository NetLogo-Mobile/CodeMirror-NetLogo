import { Diagnostic, linter, LintSource } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
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
  var BuiltSource: LintSource = (view) => {
    const State = view.state.field(stateExtension);
    if (State.GetDirty() || State.GetVersion() > LastVersion) {
      State.ParseState(view.state);
      Cached = Source(view, State);
      LastVersion = State.GetVersion();
    }
    return Cached;
  };
  var Extension = linter(BuiltSource);
  (Extension as any).Source = BuiltSource;
  return Extension;
};

export { buildLinter };
