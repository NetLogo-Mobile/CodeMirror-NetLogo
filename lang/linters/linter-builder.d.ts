import { Diagnostic } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { StateNetLogo } from '../../codemirror/extension-state-netlogo';
declare const buildLinter: (Source: (view: EditorView, parseState: StateNetLogo) => Diagnostic[]) => Extension;
export { buildLinter };
