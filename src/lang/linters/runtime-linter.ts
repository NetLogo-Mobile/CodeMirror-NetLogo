import { LintSource } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { stateExtension } from '../../codemirror/extension-state-netlogo';

// CompilerLinter: Present all linting results from the compiler.
export const CompilerLinter: LintSource = (view: EditorView) => {
  var state = view.state.field(stateExtension);
  return state.CompilerErrors.map(function (Error) {
    return {
      from: Error.start,
      to: Error.end,
      severity: 'error',
      message: Error.message,
    };
  });
};

// RuntimeLinter: Present all runtime errors.
export const RuntimeLinter: LintSource = (view: EditorView) => {
  var state = view.state.field(stateExtension);
  return state.RuntimeErrors.map(function (Error) {
    return {
      from: Error.start,
      to: Error.end,
      severity: 'error',
      message: Error.message,
    };
  });
};

// RuntimeError: Error from the compiler.
export interface RuntimeError {
  /** Message: The error message. */
  message: string;
  /** Start: The start position of the error. */
  start: number;
  /** End: The end position of the error. */
  end: number;
  /** Code: The code snippet that bears the error. */
  code?: string;
}
