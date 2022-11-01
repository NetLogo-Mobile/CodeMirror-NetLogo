/** Primitive: Static metadata of a single NetLogo primitive. */

// Seems that there are some exceptions such as
export class Primitive {
  /** Extension: Where the primitive belongs to. */
  public Extension: string;
  /** Name: Name of the primitive. */
  public Name: string;
  /** ArgumentTypes: Argument types of the primitive. */
  public ArgumentTypes: NetLogoType[];
  /** ReturnType: Return type of the primitive. */
  public ReturnType: NetLogoType;

  public constructor(
    Extension: string,
    Name: string,
    ArgumentTypes: NetLogoType[],
    ReturnType: NetLogoType
  ) {
    this.Extension = Extension;
    this.Name = Name;
    this.ArgumentTypes = ArgumentTypes;
    this.ReturnType = ReturnType;
  }
}

/** NetLogoType: Types that are available in NetLogo. */
// Maybe we need to add command blocks & anonymous procedures
export enum NetLogoType {
  Unit = 0, // = Void
  Wildcard = 1, // = Any
  String = 2,
  Number = 3,
  List = 4,
  Boolean = 5,
}

/** Breed: Dynamic metadata of a single breed. */
export class Breed {
  /** Singular: The singular name of the breed. */
  public Singular: string;
  /** Plural: The plural name of the breed. */
  public Plural: string;
  /** Variables: Variables defined for the breed. */
  public Variables: string[];

  public constructor(Singular: string, Plural: string, Variables: string[]) {
    this.Singular = Singular;
    this.Plural = Plural;
    this.Variables = Variables;
  }
}

/** Procedure: Dynamic metadata of a procedure. */
export class Procedure {
  /** name: The name of the procedure. */
  public Name: string;
  /** Arguments: The arguments of the procedure. */
  public Arguments: string[];
  /** Variables: local variables defined for the procedure. */
  public Variables: LocalVariable[];
  /** AnonymousProcedures: anonymous procedures defined for the procedure. */
  public AnonymousProcedures: AnonymousProcedure[];

  public constructor(
    Name: string,
    Arguments: string[],
    Variables: LocalVariable[],
    AnonymousProcedures: AnonymousProcedure[]
  ) {
    this.Name = Name;
    this.Arguments = Arguments;
    this.Variables = Variables;
    this.AnonymousProcedures = AnonymousProcedures;
  }
}

/** Procedure: Dynamic metadata of an anonymous procedure. */
export class AnonymousProcedure {
  /** From: The position at the start of the procedure */
  public From: number;
  /** To: The position at the end of the procedure */
  public To: number;
  /** Arguments: The arguments of the procedure. */
  public Arguments: string[];
  /** Variables: local variables defined for the procedure. */
  public Variables: LocalVariable[];

  public constructor(
    From: number,
    To: number,
    Arguments: string[],
    Variables: LocalVariable[]
  ) {
    this.From = From;
    this.To = To;
    this.Arguments = Arguments;
    this.Variables = Variables;
  }
}

/** LocalVariable: metadata for local variables */
export class LocalVariable {
  /** name: The name of the variable. */
  public Name: string;
  /** type: The type of the variable. */
  public Type: NetLogoType;
  /** name: The position where the variable was created. */
  public CreationPos: number;

  public constructor(Name: string, Type: NetLogoType, CreationPos: number) {
    this.Name = Name;
    this.Type = Type;
    this.CreationPos = CreationPos;
  }
}
