import { Diagnostic, LintSource } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { StateNetLogo } from '../../codemirror/extension-state-netlogo';
/** lintSources: All available lint sources. */
export declare const lintSources: LintSource[];
declare const buildLinter: (Source: (view: EditorView, parseState: StateNetLogo) => Diagnostic[]) => Extension;
export { buildLinter };
