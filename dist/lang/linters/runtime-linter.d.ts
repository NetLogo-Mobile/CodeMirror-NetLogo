import { Linter } from './linter-builder';
export declare const CompilerLinter: Linter;
export declare const RuntimeLinter: Linter;
export interface RuntimeError {
    message: string;
    start: number;
    end: number;
}
