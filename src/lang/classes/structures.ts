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
  /** BlockContext: Context in the command block of the primitive. */
  BlockContext?: AgentContexts;
  /** DefaultOption: Default number of arguments. */
  DefaultOption?: number;
  /** MinimumOption: Minimum number of arguments. */
  MinimumOption?: number;
  /** IsRightAssociative: Unsure what this is for. */
  IsRightAssociative?: boolean;
  /** IntroducesContext: If this primitive introduces a new context. */
  IntroducesContext?: boolean;
  /** CanBeConcise: Unsure what this is for. */
  CanBeConcise?: boolean;
  /** InheritParentContext: If this primitive inherits the context of its parent. */
  InheritParentContext?: boolean;
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

/** BreedLocation: Possible locations of breed name in primitives. */
export enum BreedLocation {
  First,
  Second,
  Third,
  Middle,
  Question,
  Null,
}

/** AgentContexts: Agent contexts of a primitive. */
export class AgentContexts {
  /** Observer: Whether the context includes observers. */
  public Observer: boolean;
  /** Turtle: Whether the context includes turtles. */
  public Turtle: boolean;
  /** Patch: Whether the context includes patches. */
  public Patch: boolean;
  /** Link: Whether the context includes links. */
  public Link: boolean;
  /** Parse an agent-context string. */
  public constructor(Input?: string) {
    this.Observer = true;
    this.Turtle = true;
    this.Patch = true;
    this.Link = true;
    if (!Input) return;
    if (Input == '?') {
      this.Observer = false;
      return;
    }
    if (Input[0] != 'O') this.Observer = false;
    if (Input[1] != 'T') this.Turtle = false;
    if (Input[2] != 'P') this.Patch = false;
    if (Input[3] != 'L') this.Link = false;
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
  /** BreedType: Type of the breed. */
  public BreedType: BreedType;
  /** EditorID: Which editor created the breed (for LinkContext). */
  public EditorID?: number;
  /** Build a breed. */
  public constructor(
    Singular: string,
    Plural: string,
    Variables: string[],
    BreedType: BreedType
  ) {
    this.Singular = Singular;
    this.Plural = Plural;
    this.Variables = Variables;
    this.BreedType = BreedType;
  }
}

/** BreedType: Type of the breed. */
export enum BreedType {
  Turtle = 0,
  Patch = 1,
  UndirectedLink = 2,
  DirectedLink = 3,
}

/** Procedure: Dynamic metadata of a procedure. */
export class Procedure {
  /** Name: The name of the procedure. */
  public Name: string = '';
  /** Arguments: The arguments of the procedure. */
  public Arguments: string[] = [];
  /** Variables: Local variables defined within the procedure. */
  public Variables: LocalVariable[] = [];
  /** AnonymousProcedures: Anonymous procedures defined for the procedure. */
  public AnonymousProcedures: Procedure[] = [];
  /** PositionStart: The starting position of the procedure in the document. */
  public PositionStart: number = 0;
  /** PositionEnd: The end position of the procedure in the document. */
  public PositionEnd: number = 0;
  /** IsCommand: Is the procedure a command (to) instead of a reporter (to-report)? */
  public IsCommand: boolean = false;
  /** IsCommand: Is the procedure anonymous? */
  public IsAnonymous: boolean = false;
  /** Context: The possible contexts for the procedure. */
  public Context: AgentContexts = new AgentContexts();
  /** CodeBlocks: Code blocks within the procedure. */
  public CodeBlocks: CodeBlock[] = [];
  /** EditorID: which editor created the procedure (for LinkContext). */
  public EditorID?: number;
}

/** CodeBlock: Dynamic metadata of a code block. */
export class CodeBlock {
  /** PositionStart: The position at the start of the code block. */
  public PositionStart: number = 0;
  /** PositionEnd: The position at the end of the code block. */
  public PositionEnd: number = 0;
  /** Context: The possible contexts for the code block */
  public Context: AgentContexts = new AgentContexts();
  /** CodeBlocks: Code blocks within the code block. */
  public CodeBlocks: CodeBlock[] = [];
  /** Variables: Local variables defined within the code block. */
  public Variables: LocalVariable[] = [];
  /** Arguments: The arguments accessible within the code block. */
  public Arguments: string[] = [];
  /** AnonymousProcedures: Anonymous procedures defined within the code block. */
  public AnonymousProcedures: Procedure[] = [];
  /** Primitive: the primitive that created the codeblock. */
  public Primitive: string = '';
  /** Breed: the breed in the primitive that created the codeblock (if present). */
  public Breed: string | null = null;
  /** InheritParentContext: whether context needs to match parent context. */
  public InheritParentContext: boolean = false;
}

/** Procedure: Dynamic metadata of an anonymous procedure. */
export class AnonymousProcedure {
  /** PositionStart: The position at the start of the procedure. */
  public PositionStart: number = 0;
  /** PositionEnd: The position at the end of the procedure. */
  public PositionEnd: number = 0;
  /** Arguments: The arguments of the procedure. */
  public Arguments: string[] = [];
  /** Variables: Local variables defined within the procedure. */
  public Variables: LocalVariable[] = [];
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

/** ContextError: Error caused by context conflict. */
export class ContextError {
  /** From: The start of the error. */
  public From: number;
  /** To: The end of the error. */
  public To: number;
  /** PriorContext: The context of the procedure/code block. */
  public PriorContext: AgentContexts;
  /** ConflictingContext: The new context that is conflicting. */
  public ConflictingContext: AgentContexts;
  /** Primitive: The primitive that causes the conflict. */
  public Primitive: string;
  /** Constructor: Build a context error. */
  public constructor(
    From: number,
    To: number,
    PriorContext: AgentContexts,
    ConflictingContext: AgentContexts,
    Primitive: string
  ) {
    this.From = From;
    this.To = To;
    this.PriorContext = PriorContext;
    this.ConflictingContext = ConflictingContext;
    this.Primitive = Primitive;
  }
}
