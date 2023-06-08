import { Diagnostic, linter, LintSource } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { stateExtension, StateNetLogo } from '../../codemirror/extension-state-netlogo';
import { LintContext, PreprocessContext } from '../classes/contexts';
import { GalapagosEditor, Localized } from '../../editor';

/** Linter: A function that takes a view and parse state and returns a list of diagnostics. */
type Linter = (
  view: EditorView,
  preprocessContext: PreprocessContext,
  lintContext: LintContext,
  parseState?: StateNetLogo
) => Diagnostic[];

/** buildLinter: Builds a linter extension from a linter function. */
const buildLinter = function (Source: Linter, Editor: GalapagosEditor): Extension {
  var LastVersion = -1;
  var Cached: Diagnostic[] = [];
  var BuiltSource: LintSource = (view) => {
    if (Editor.UpdateContext() || Editor.GetVersion() > LastVersion) {
      var state = view.state.field(stateExtension);
      Cached = Source(view, Editor.PreprocessContext, Editor.LintContext, state);
      LastVersion = Editor.GetVersion();
    }
    return Cached;
    // return Cached.filter(
    //   (d) =>
    //     d.to < view.state.selection.main.from ||
    //     d.from > view.state.selection.main.to
    // );
  };
  // var Extension = linter(BuiltSource, {
  //   needsRefresh: (update) =>
  //     update.docChanged ||
  //     update.startState.selection.main != update.state.selection.main,
  // });
  var Extension = linter(BuiltSource) as any;
  Extension.Source = BuiltSource;
  console.log(Extension);
  return Extension;
};

/** getDiagnostic: Returns a diagnostic object from a node and message. */
export const getDiagnostic = function (
  view: EditorView,
  node: { from: number; to: number },
  message: string,
  severity: 'error' | 'info' | 'warning' = 'error',
  ...values: string[]
): Diagnostic {
  var value = view.state.sliceDoc(node.from, node.to).trim();
  // Cut short the value if it's too long
  if (value.length >= 20) value = value.substring(0, 17) + '...';
  if (values.length == 0) values.push(value);
  return {
    from: node.from,
    to: node.from + value.length,
    severity: severity,
    message: Localized.Get(message, ...values),
  };
};

/** getNodeTo: Returns the proper end of a node. */
export const getNodeTo = function (node: { from: number; to: number }, view: EditorView) {
  let val = view.state.sliceDoc(node.from, node.to);
  val = val.trimEnd();
  return node.from + val.length;
};

export { buildLinter, Linter };
