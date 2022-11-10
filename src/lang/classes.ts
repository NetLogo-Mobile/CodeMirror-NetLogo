/** Primitive: Static metadata of a single NetLogo primitive. */
export interface Primitive {
  /** Extension: Where the primitive belongs to. */
  Extension: string;
  /** Name: Name of the primitive. */
  Name: string;
  /** LeftArgumentType: Type of the argument to the left of the primitive. */
  LeftArgumentType: Argument | null;
  /** RightArgumentTypes: Type of the argument to the right of the primitive. */
  RightArgumentTypes: Argument[];
  /** ReturnType: Return type of the primitive. */
  ReturnType: Argument;
  /** Precedence: Precedence of the primitive. */
  Precedence: number;
  /** AgentContext: Acceptable context for the primitive. */
  AgentContext: AgentContexts;
  /** AgentContext: Context in the command block of the primitive. */
  BlockContext?: AgentContexts;
  /** DefaultOption: Unsure what this is for. */
  DefaultOption?: number | null;
  /** MinimumOption: Unsure what this is for. */
  MinimumOption?: number | null;
  /** IsRightAssociative: Unsure what this is for. */
  IsRightAssociative?: boolean;
  /** IntroducesContext: If this primitive introduces a new context. */
  IntroducesContext?: boolean;
  /** CanBeConcise: Unsure what this is for. */
  CanBeConcise?: boolean;
}

/** Argument: Static metadata of a NetLogo primitive's argument. */
export interface Argument {
  Types: NetLogoType[];
  CanRepeat: boolean;
  Optional: boolean;
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
  Nobody = 8,
  Turtle = 9,
  Patch = 10,
  Link = 11,
  CommandBlock = 12,
  CodeBlock = 13,
  NumberBlock = 14,
  Reporter = 15,
  Symbol = 16,
  LinkSet = 17,
  ReporterBlock = 18,
  BooleanBlock = 19,
  Command = 20,
  Other = 21,
}

/** AgentContexts: Agent contexts of a primitive. */
export class AgentContexts {
  public Observer: boolean;
  public Turtle: boolean;
  public Patch: boolean;
  public Link: boolean;
  /** Parse an agent-context string. */
  public constructor(Input?: string) {
    this.Observer = true;
    this.Turtle = true;
    this.Patch = true;
    this.Link = true;
    if (!Input) return;
    if (Input[0] != 'O') this.Observer = false;
    if (Input[1] != 'T') this.Turtle = false;
    if (Input[2] != 'P') this.Patch = false;
    if (Input[3] != 'L') this.Patch = false;
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
  /** Build a breed. */
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
  /** PositionStart: The starting position of the procedure in the document. */
  public PositionStart: number;
  /** PositionEnd: The end position of the procedure in the document. */
  public PositionEnd: number;
  /** Build a procedure. */
  public constructor(
    Name: string,
    Arguments: string[],
    Variables: LocalVariable[],
    AnonymousProcedures: AnonymousProcedure[],
    PositionStart: number,
    PositionEnd: number
  ) {
    this.Name = Name;
    this.Arguments = Arguments;
    this.Variables = Variables;
    this.AnonymousProcedures = AnonymousProcedures;
    this.PositionStart = PositionStart;
    this.PositionEnd = PositionEnd;
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
  /** Build an anonymous procedure. */
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
  /** Name: The name of the variable. */
  public Name: string;
  /** Type: The type of the variable. */
  public Type: NetLogoType;
  /** CreationPos: The position where the variable was created. */
  public CreationPos: number;
  /** Build a local variable. */
  public constructor(Name: string, Type: NetLogoType, CreationPos: number) {
    this.Name = Name;
    this.Type = Type;
    this.CreationPos = CreationPos;
  }
}
