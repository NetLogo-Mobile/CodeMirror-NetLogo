import { Diagnostic, linter, LintSource } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import {
  stateExtension,
  StateNetLogo,
} from '../../codemirror/extension-state-netlogo';

/** Linter: A function that takes a view and parse state and returns a list of diagnostics. */
type Linter = (view: EditorView, parseState: StateNetLogo) => Diagnostic[];

/** buildLinter: Builds a linter extension from a linter function. */
const buildLinter = function (Source: Linter): Extension {
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

export { buildLinter, Linter };
