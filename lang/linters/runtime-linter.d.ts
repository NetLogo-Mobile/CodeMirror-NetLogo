import { LintSource } from '@codemirror/lint';
export declare const CompilerLinter: LintSource;
export declare const RuntimeLinter: LintSource;
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
//# sourceMappingURL=runtime-linter.d.ts.map