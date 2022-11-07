import { Primitive, NetLogoType, AgentTypes, Argument } from './classes';

/** Primitives: Managing all primitives.  */
export class Primitives {
  public Metadata: Map<string, Primitive> = new Map<string, Primitive>();
  /** ImportNLW: Import primitive metadatas from NLW. */
  public ImportNL(Extension: string, Type: string, Source: NLPrimitive) {
    this.Metadata.set(
      Source.name,
      new Primitive(
        Extension,
        Source.name,
        Type,
        convertToArgument(Source.syntax.left),
        Source.syntax.right.map((item) => convertToArgument(item)),
        convertToArgument(Source.syntax.ret),
        Source.syntax.precedence,
        new AgentTypes(Source.syntax.agentClassString),
        new AgentTypes(Source.syntax.blockAgentClassString),
        Source.syntax.defaultOption,
        Source.syntax.minimumOption,
        Source.syntax.isRightAssociative,
        Source.syntax.introducesContext == 'true',
        Source.syntax.canBeConcise
      )
    );
  }
}

const convertToArgument = function (item: string | NLArgument) {
  if (typeof item == 'string') {
    return new Argument([convertToType(item)], false, false);
  } else if (item.type) {
    return new Argument(
      [convertToType(item.type)],
      item.isRepeatable,
      item.isOptional ?? false
    );
  } else {
    return new Argument(
      item.types?.map((i) => convertToType(i)) ?? [],
      item.isRepeatable,
      item.isOptional ?? false
    );
  }
};

const convertToType = function (type: string) {
  if (type == 'unit') {
    return NetLogoType.Unit;
  } else if (type == 'wildcard') {
    return NetLogoType.Wildcard;
  } else if (type == 'string') {
    return NetLogoType.String;
  } else if (type == 'number') {
    return NetLogoType.Number;
  } else if (type == 'list') {
    return NetLogoType.List;
  } else if (type == 'boolean') {
    return NetLogoType.Boolean;
  } else if (type == 'agent') {
    return NetLogoType.Agent;
  } else if (type == 'agentset' || type.indexOf('agentset') > -1) {
    return NetLogoType.AgentSet;
  } else if (type == 'commandblock') {
    return NetLogoType.CommandBlock;
  } else if (type == 'nobody') {
    return NetLogoType.Nobody;
  } else if (type == 'codeblock') {
    return NetLogoType.CodeBlock;
  } else if (type == 'numberblock') {
    return NetLogoType.NumberBlock;
  } else if (type == 'reporter') {
    return NetLogoType.Reporter;
  } else if (type == 'turtle') {
    return NetLogoType.Turtle;
  } else if (type == 'patch') {
    return NetLogoType.Patch;
  } else if (type == 'symbol') {
    return NetLogoType.Symbol;
  } else {
    return NetLogoType.Other;
  }
};

export interface NLArgument {
  type?: string;
  types?: string[];
  isRepeatable: boolean;
  isOptional?: boolean;
}

/** NLWPrimitive: Metadata structure for NetLogo Web primitives. */
export interface NLPrimitive {
  name: string;
  syntax: {
    precedence: number;
    left: string | NLArgument;
    right: (string | NLArgument)[];
    ret: string | NLArgument;
    defaultOption: null | number;
    minimumOption: null | number;
    isRightAssociative: boolean;
    agentClassString: string;
    blockAgentClassString: string;
    introducesContext: string;
    canBeConcise: boolean;
  };
}
