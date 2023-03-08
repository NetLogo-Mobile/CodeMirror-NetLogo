import { Diagnostic, linter, LintSource } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import {
  stateExtension,
  StateNetLogo,
} from '../../codemirror/extension-state-netlogo';

/** lintSources: All available lint sources. */
export const lintSources: LintSource[] = [];

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
  lintSources.push(BuiltSource);
  return linter(BuiltSource);
};

export { buildLinter };
