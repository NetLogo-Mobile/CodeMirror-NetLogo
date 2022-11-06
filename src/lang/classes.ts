/** Primitive: Static metadata of a single NetLogo primitive. */
export class Primitive {
  /** Extension: Where the primitive belongs to. */
  public Extension: string;
  /** Name: Name of the primitive. */
  public Name: string;
  /** Type: 'Command' or 'Reporter' */
  public Type: string;
  /** LeftArgumentType: Type of the argument to the left of the primitive. */
  public LeftArgumentType: Argument;
  /** RightArgumentTypes: Type of the argument to the right of the primitive. */
  public RightArgumentTypes: Argument[];
  /** ReturnType: Return type of the primitive. */
  public ReturnType: Argument;
  public Precedence: number;
  public AgentContext: AgentTypes;
  public BlockContext: AgentTypes;
  public DefaultOption: number | null;
  public MinimumOption: number | null;
  public RightAssociative: boolean;
  public IntroducesContext: boolean;
  public CanBeConcise: boolean;

  public constructor(
    Extension: string,
    Name: string,
    Type: string,
    LeftArgumentType: Argument,
    RightArgumentTypes: Argument[],
    ReturnType: Argument,
    Precedence: number,
    AgentContext: AgentTypes,
    BlockContext: AgentTypes,
    DefaultOption: number | null,
    MinimumOption: number | null,
    RightAssociative: boolean,
    IntroducesContext: boolean,
    CanBeConcise: boolean
  ) {
    this.Extension = Extension;
    this.Name = Name;
    this.Type = Type;
    this.LeftArgumentType = LeftArgumentType;
    this.RightArgumentTypes = RightArgumentTypes;
    this.ReturnType = ReturnType;
    this.Precedence = Precedence;
    this.AgentContext = AgentContext;
    this.BlockContext = BlockContext;
    this.DefaultOption = DefaultOption;
    this.MinimumOption = MinimumOption;
    this.RightAssociative = RightAssociative;
    this.IntroducesContext = IntroducesContext;
    this.CanBeConcise = CanBeConcise;
  }
}

export class Argument {
  public Types: NetLogoType[];
  public CanRepeat: boolean;
  public Optional: boolean;

  public constructor(
    types: NetLogoType[],
    canRepeat: boolean,
    optional: boolean
  ) {
    this.Types = types;
    this.CanRepeat = canRepeat;
    this.Optional = optional;
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
  Agent = 6,
  AgentSet = 7,
  CommandBlock = 8,
  Nobody = 9,
  CodeBlock = 10,
  NumberBlock = 11,
  Reporter = 12,
  Turtle = 13,
  Patch = 14,
  Symbol = 15,
  Other = 16,
}

export class AgentTypes {
  public Observer: boolean;
  public Turtle: boolean;
  public Patch: boolean;
  public Link: boolean;
  public constructor(input: string) {
    this.Observer = false;
    this.Turtle = false;
    this.Patch = false;
    this.Link = false;
    if (input != 'null') {
      if (input.indexOf('O') > -1) {
        this.Observer = true;
      } else if (input.indexOf('T') > -1) {
        this.Turtle = true;
      } else if (input.indexOf('P') > -1) {
        this.Patch = true;
      } else if (input.indexOf('L') > -1) {
        this.Link = true;
      }
    }
  }
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
