export class Primitive {
    public Name: string;
    public ArgumentTypes: NetLogoType[];
    public ReturnType: NetLogoType;
}

export class Breed {
    public Name: string;
    public Plural: string;
    public Variables: string[];
}

/** NetLogoType: Types that are available in NetLogo. */
export enum NetLogoType {
    Unit = 0, // = Void
    Wildcard = 1, // = Any
    String = 2,
    Number = 3,
    List = 4,
    Boolean = 5
}