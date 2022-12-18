import { NetLogoType, Primitive } from '../classes';
import { Dataset } from './dataset';
import { Completion } from '@codemirror/autocomplete';

/** Primitives: Managing all primitives.  */
export class Primitives {
  /** Metadata: The dictionary for metadata. */
  private Metadata: Map<string, Primitive> = new Map<string, Primitive>();
  /** Extensions: The dictionary for extensions. */
  private Extensions: Map<string, Primitive[]> = new Map<string, Primitive[]>();
  /** ExtensionNames: The list for known extensions. */
  private ExtensionNames: string[] = [];

  /** Register: Register a primitive information. */
  public Register(Extension: string, Source: Primitive) {
    var FullName =
      Extension == '' ? Source.Name : `${Extension}:${Source.Name}`;
    if (!this.Metadata.has(FullName)) {
      if (this.ExtensionNames.indexOf(Extension) == -1) {
        this.ExtensionNames.push(Extension);
        this.Extensions.set(Extension, []);
      }
      this.Extensions.get(Extension)!.push(Source);
      this.Metadata.set(FullName, Source);
    }
  }

  /** BuildInstance: Build a primitive manager instance. */
  public static BuildInstance(): Primitives {
    var Result = new Primitives();
    Dataset.forEach((Primitive) =>
      Result.Register(Primitive.Extension, Primitive)
    );
    return Result;
  }

  /** GetPrimitive: Get a primitive from an extension. */
  public GetPrimitive(Extension: string, Name: string): Primitive | null {
    var FullName = Extension == '' ? Name : `${Extension}:${Name}`;
    return this.Metadata.get(FullName) ?? null;
  }
  /** HasNPrimitive: Is there a named primitive. */
  public HasPrimitive(Extension: string, Name: string): boolean {
    var FullName = Extension == '' ? Name : `${Extension}:${Name}`;
    return this.Metadata.has(FullName);
  }
  /** GetNamedPrimitive: Get a named primitive. */
  public GetNamedPrimitive(FullName: string): Primitive | null {
    return this.Metadata.get(FullName) ?? null;
  }
  /** HasNamedPrimitive: Is there a named primitive. */
  public HasNamedPrimitive(FullName: string): boolean {
    return this.Metadata.has(FullName);
  }
  /** IsReporter: Is the primitive a reporter. */
  public IsReporter(Source: Primitive): boolean {
    return Source.ReturnType.Types[0] != NetLogoType.Unit;
  }
  /** GetExtensions: Get the names of extensions. */
  public GetExtensions(): string[] {
    return this.ExtensionNames;
  }
  /** GetCompletions: Get a proper completion list for primitives. */
  public GetCompletions(Extensions: string[]): Completion[] {
    var Results: Completion[] = [];
    for (var Primitive of this.Metadata.values()) {
      if (
        Primitive.Extension == '' ||
        Extensions.indexOf(Primitive.Extension) != -1
      )
        Results.push({
          label: Primitive.Name,
          type: this.IsReporter(Primitive) ? 'Reporter' : 'Command',
        });
    }
    return Results;
  }
}

/** PrimitiveManager: The Singleton Instance. */
export const PrimitiveManager = Primitives.BuildInstance();

/** Export classes globally. */
try {
  (window as any).PrimitiveManager = Primitives;
} catch (error) {}
