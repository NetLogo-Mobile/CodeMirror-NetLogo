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
  preprocessContext: PreprocessContext,
  lintContext: LintContext,
  parseState?: StateNetLogo
) => Diagnostic[];

/** buildLinter: Builds a linter extension from a linter function. */
const buildLinter = function (
  Source: Linter,
  Editor: GalapagosEditor
): Extension {
  var LastVersion = -1;
  var Cached: Diagnostic[] = [];
  var BuiltSource: LintSource = (view) => {
    if (Editor.UpdateContext() || Editor.GetVersion() > LastVersion) {
      var state = view.state.field(stateExtension);
      Cached = Source(
        view,
        Editor.PreprocessContext,
        Editor.LintContext,
        state
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
