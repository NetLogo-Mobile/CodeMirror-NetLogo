import { linter } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { stateExtension } from '../../codemirror/extension-state-netlogo';
import { buildLinter } from './linter-builder';
import { Linter } from './linter-builder';

// CompilerLinter: Present all linting results from the compiler.
export const CompilerLinter: Linter = (view, parseState,preprocessContext,lintContext) => {
  return parseState.CompilerErrors.map(function (Error) {
    return {
      from: Error.start,
      to: Error.end,
      severity: 'error',
      message: Error.message,
    };
  });
};

// RuntimeLinter: Present all runtime errors.
export const RuntimeLinter: Linter = (view, parseState,preprocessContext,lintContext) => {
  return parseState.RuntimeErrors.map(function (Error) {
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
  message: string;
  start: number;
  end: number;
}
