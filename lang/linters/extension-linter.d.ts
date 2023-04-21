import { Linter } from './linter-builder';
import { SyntaxNode } from '@lezer/common';
import { EditorView } from 'codemirror';
export declare const ExtensionLinter: Linter;
export declare const addExtension: (view: EditorView, index: number, extension: string, extension_node: null | SyntaxNode, make_pretty: boolean) => void;
