import { Primitive, NetLogoType } from './classes';

/** Primitives: Managing all primitives.  */
export class Primitives {
  private Metadata: Map<string, Primitive> = new Map<string, Primitive>();
  /** ImportNLW: Import primitive metadatas from NLW. */
  public ImportNLW(Extension: string, Source: NLWPrimitive) {
    this.Metadata.set(Source.name, {
      Name: Source.name,
      ArgumentTypes: Source.argTypes,
      ReturnType: Source.returnType,
      Extension,
    });
  }
}

/** NLWPrimitive: Metadata structure for NetLogo Web primitives. */
export interface NLWPrimitive {
  name: string;
  argTypes: NetLogoType[];
  returnType: NetLogoType;
}
