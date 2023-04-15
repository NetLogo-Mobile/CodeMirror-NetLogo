import { EditorView } from 'codemirror';
export declare const AppendGlobal: (view: EditorView, content: string, statement_type: string) => void;
export declare const AddBreed: (view: EditorView, breed: string, plural: string, singular: string) => void;
export declare const AddBreedVar: (view: EditorView, breed: string, var_name: string) => void;
export declare const ReplaceProcedure: (view: EditorView, name: string, content: string) => void;
