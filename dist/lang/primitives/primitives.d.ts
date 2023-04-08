import { Primitive } from '../classes';
import { Completion } from '@codemirror/autocomplete';
/** Primitives: Managing all primitives.  */
export declare class Primitives {
    /** Metadata: The dictionary for metadata. */
    private Metadata;
    /** Extensions: The dictionary for extensions. */
    private Extensions;
    /** ExtensionNames: The list for known extensions. */
    private ExtensionNames;
    /** Register: Register a primitive information. */
    Register(Extension: string, Source: Primitive): void;
    /** BuildInstance: Build a primitive manager instance. */
    static BuildInstance(): Primitives;
    /** GetPrimitive: Get a primitive from an extension. */
    GetPrimitive(Extension: string, Name: string): Primitive | null;
    /** HasNPrimitive: Is there a named primitive. */
    HasPrimitive(Extension: string, Name: string): boolean;
    /** GetNamedPrimitive: Get a named primitive. */
    GetNamedPrimitive(FullName: string): Primitive | null;
    /** HasNamedPrimitive: Is there a named primitive. */
    HasNamedPrimitive(FullName: string): boolean;
    /** IsReporter: Is the primitive a reporter. */
    IsReporter(Source: Primitive): boolean;
    /** GetExtensions: Get the names of extensions. */
    GetExtensions(): string[];
    /** GetCompletions: Get a proper completion list for primitives. */
    GetCompletions(Extensions: string[]): Completion[];
}
/** PrimitiveManager: The Singleton Instance. */
export declare const PrimitiveManager: Primitives;
