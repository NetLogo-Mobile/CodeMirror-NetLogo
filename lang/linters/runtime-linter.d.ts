import { LintSource } from '@codemirror/lint';
export declare const CompilerLinter: LintSource;
export declare const RuntimeLinter: LintSource;
export interface RuntimeError {
    message: string;
    start: number;
    end: number;
}
