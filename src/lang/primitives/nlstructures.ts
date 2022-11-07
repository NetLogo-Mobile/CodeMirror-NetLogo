/** NLWPrimitive: Metadata structure for NetLogo Web primitives. */
export interface NLWPrimitive {
  name: string;
  argTypes: string[];
  returnType: string;
  agentClassString?: string;
}

/** NLArgument: Metadata structure for NetLogo argument. */
export interface NLArgument {
  type?: string;
  types?: string[];
  isRepeatable: boolean;
  isOptional?: boolean;
}

/** NLWPrimitive: Metadata structure for NetLogo Desktop primitives. */
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
