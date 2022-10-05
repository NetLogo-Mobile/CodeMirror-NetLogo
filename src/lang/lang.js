// This file was generated by lezer-generator. You probably shouldn't edit it.
import {LRParser} from "@lezer/lr"
import {keyword} from "./tokenizer.js"
export const parser = LRParser.deserialize({
  version: 14,
  states: "!WQYQROOO!QQRO'#CmOOQQ'#Cr'#CrOOQQ'#Cn'#CnQYQROOOOQQ,59X,59XO!XQRO,59XOOQQ-E6l-E6lOOQQ1G.s1G.s",
  stateData: "!`~OeOSZOS~OQQORQOSQOTQOUQOVQOWQOXQOYQO]QO^QO`PO~O_TO~PYO_WO~PYO",
  goto: "!OgPPPPPPPPPPPPPPPPPhnPPPxXQOPSUQSOQUPTVSUXROPSU",
  nodeNames: "⚠ Identifier Directives Commands Extensions Reporters TurtleVars PatchVars LinkVars Constants Unsupported LineComment Program Numeric String ] [ Application",
  maxTerm: 22,
  nodeProps: [
    ["openedBy", 15,"["],
    ["closedBy", 16,"]"]
  ],
  skippedNodes: [0,1,11],
  repeatNodeCount: 1,
  tokenData: "#h~RXXYnYZn]^npqnrs!P!Q![!n!]!^#R!}#O#^#P#Q#c~sSe~XYnYZn]^npqn~!STOr!Prs!cs#O!P#O#P!h#P~!P~!hO^~~!kPO~!P~!sQ]~!O!P!y!Q![!n~#OP]~!Q![!y~#WQZ~OY#RZ~#R~#cO`~~#hO_~",
  tokenizers: [0, keyword],
  topRules: {"Program":[0,12]},
  tokenPrec: 0
})