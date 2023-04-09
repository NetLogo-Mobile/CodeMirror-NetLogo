import { Diagnostic, linter, LintSource } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import {
  stateExtension,
  StateNetLogo,
} from '../../codemirror/extension-state-netlogo';
import { LintContext, PreprocessContext } from '../classes';
import { GalapagosEditor } from '../../editor';

/** Linter: A function that takes a view and parse state and returns a list of diagnostics. */
type Linter = (
  view: EditorView,
  parseState: StateNetLogo,
  preprocessContext: PreprocessContext,
  lintContext: LintContext
) => Diagnostic[];

/** buildLinter: Builds a linter extension from a linter function. */
const buildLinter = function (
  Source: Linter,
  Editor: GalapagosEditor
): Extension {
  var LastVersion = 0;
  var Cached: Diagnostic[];
  var BuiltSource: LintSource = (view) => {
    const State = view.state.field(stateExtension);
    var Dirty = State.GetDirty();
    if (Dirty) {
      State.ParseState(view.state);
      Editor.UpdateContext();
    }
    if (Dirty || Editor.GetVersion() > LastVersion) {
      Cached = Source(
        view,
        State,
        Editor.PreprocessContext,
        Editor.LintContext
      );
      LastVersion = Editor.GetVersion();
    }
    return Cached;
  };
  var Extension = linter(BuiltSource);
  (Extension as any).Source = BuiltSource;
  return Extension;
};

export { buildLinter, Linter };
