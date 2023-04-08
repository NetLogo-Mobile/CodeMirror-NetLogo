import { Diagnostic } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { StateNetLogo } from '../../codemirror/extension-state-netlogo';
import { LintContext, PreprocessContext } from '../classes';
import { GalapagosEditor } from '../../editor';
/** Linter: A function that takes a view and parse state and returns a list of diagnostics. */
type Linter = (view: EditorView, parseState: StateNetLogo, preprocessContext: PreprocessContext, lintContext: LintContext) => Diagnostic[];
/** buildLinter: Builds a linter extension from a linter function. */
declare const buildLinter: (Source: Linter, editor: GalapagosEditor) => Extension;
export { buildLinter, Linter };
