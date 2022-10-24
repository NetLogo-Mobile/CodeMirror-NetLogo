import { Primitive, NetLogoType } from "./classes";

export class Primitives {
    private Metadata: Map<string, Primitive>;

    public ImportNLW(Source: NLWPrimitive) {
        this.Metadata.set(Source.name, {
            Name: Source.name,
            ArgumentTypes: Source.argTypes,
            ReturnType: Source.returnType         
        });
    }    
}

export interface NLWPrimitive {
    name: string,
    argTypes: NetLogoType[],
    returnType: NetLogoType
}