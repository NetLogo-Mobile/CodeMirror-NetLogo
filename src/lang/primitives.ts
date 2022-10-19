import { Primitive } from "./primitive";

export class Primitives {
    private Metadata: Map<string, Primitive>;

    public ImportNLW(Source: NLWPrimitive) {
        this.Metadata.set(Source.name, {
            Name: Source.name,
            
        });
    }    
}

export interface NLWPrimitive {
    name: string,
    argTypes: string[],
    returnType: string
}