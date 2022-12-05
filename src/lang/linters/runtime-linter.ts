import { linter } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { stateExtension } from '../../codemirror/extension-state-netlogo';

// CompilerLinter: Present all linting results from the compiler.
export const CompilerLinter = linter((view: EditorView) => {
  const State = view.state.field(stateExtension);
  return State.CompilerErrors.map(function (Error) {
    return {
      from: Error.start,
      to: Error.end,
      severity: 'error',
      message: Error.message,
    };
  });
});

// RuntimeLinter: Present all runtime errors.
export const RuntimeLinter = linter((view: EditorView) => {
  const State = view.state.field(stateExtension);
  return State.RuntimeErrors.map(function (Error) {
    return {
      from: Error.start,
      to: Error.end,
      severity: 'error',
      message: Error.message,
    };
  });
});

// RuntimeError: Error from the compiler.
export interface RuntimeError {
  message: string;
  start: number;
  end: number;
}
