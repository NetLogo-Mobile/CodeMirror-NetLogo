import { Diagnostic, linter, LintSource } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import {
  stateExtension,
  StateNetLogo,
} from '../../codemirror/extension-state-netlogo';
import { LintContext, PreprocessContext } from '../classes';
import { GalapagosEditor } from '../../editor';
import { globalStateExtension } from '../../codemirror/extension-global-state';

/** Linter: A function that takes a view and parse state and returns a list of diagnostics. */
type Linter = (view: EditorView, parseState: StateNetLogo,preprocessContext:PreprocessContext,lintContext:LintContext) => Diagnostic[];

/** buildLinter: Builds a linter extension from a linter function. */
const buildLinter = function (Source: Linter,editor:GalapagosEditor): Extension {
  var LastVersion = 0;
  var Cached: Diagnostic[];
  var BuiltSource: LintSource = (view) => {
    const State = view.state.field(stateExtension);
    const PreprocessContext = view.state.field(globalStateExtension).GetPreprocessContext(State.Mode=='Embedded')
    const LintContext = view.state.field(globalStateExtension).GetLintContext(State.Mode=='Embedded')
    if (State.GetDirty() || State.GetVersion() > LastVersion) {
      //console.log("linter",PreprocessContext,LintContext,State.Mode)
      State.ParseState(view.state);
      Cached = Source(view, State,PreprocessContext,LintContext);
      LastVersion = State.GetVersion();
    }
    return Cached;
  };
  //lintSources.push(BuiltSource);
  return linter(BuiltSource);
};

export { buildLinter, Linter };
