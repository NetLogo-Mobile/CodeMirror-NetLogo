export declare const CompilerLinter: import("@codemirror/state").Extension;
export declare const RuntimeLinter: import("@codemirror/state").Extension;
export interface RuntimeError {
    message: string;
    start: number;
    end: number;
}
