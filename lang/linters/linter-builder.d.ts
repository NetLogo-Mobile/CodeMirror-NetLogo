import { Diagnostic } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { StateNetLogo } from '../../codemirror/extension-state-netlogo';
/** Linter: A function that takes a view and parse state and returns a list of diagnostics. */
type Linter = (view: EditorView, parseState: StateNetLogo) => Diagnostic[];
/** buildLinter: Builds a linter extension from a linter function. */
declare const buildLinter: (Source: Linter) => Extension;
export { buildLinter, Linter };
