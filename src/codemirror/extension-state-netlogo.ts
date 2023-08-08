import { StateField, Transaction, EditorState } from '@codemirror/state';

import {
  Breed,
  LocalVariable,
  Procedure,
  CodeBlock,
  AgentContexts,
  ContextError,
  BreedType,
} from '../lang/classes/structures';
import { combineContexts, noContext } from '../utils/context-utils';
import { SyntaxNode, SyntaxNodeRef } from '@lezer/common';
import { RuntimeError } from '../lang/linters/runtime-linter';
import { PrimitiveManager } from '../lang/primitives/primitives';
import { ParseMode } from '../editor-config';
import { Log } from '../utils/debug-utils';
import { GetCursorUntilMode } from '../lang/utils/cursors';
import { getCodeName } from '../lang/utils/code';
import { PreprocessContext } from '../lang/classes/contexts';
import { syntaxTree } from '@codemirror/language';
import { MatchBreed } from '../lang/parsers/breed';

let primitives = PrimitiveManager;

/** StateNetLogo: The second-pass editor state for the NetLogo Language. */
export class StateNetLogo {
  // #region "Information"
  /** Preprocess: Preprocess context from all editors in the first pass. */
  public Preprocess: PreprocessContext = new PreprocessContext();
  /** Extensions: Extensions in the code. */
  public Extensions: string[] = [];
  /** Globals: Globals in the code. */
  public Globals: string[] = [];
  /** WidgetGlobals: Globals from the widgets. */
  public WidgetGlobals: string[] = [];
  /** Breeds: Breeds in the code. */
  public Breeds: Map<string, Breed> = new Map<string, Breed>();
  /** Procedures: Procedures in the code. */
  public Procedures: Map<string, Procedure> = new Map<string, Procedure>();
  /** CompilerErrors: Errors from the compiler. */
  public CompilerErrors: RuntimeError[] = [];
  /** CompilerErrors: Errors during the runtime. */
  public RuntimeErrors: RuntimeError[] = [];
  /** IsDirty: Whether the current state is dirty. */
  private IsDirty: boolean = true;
  /** Mode: The editor's parsing mode. */
  public Mode: ParseMode = ParseMode.Normal;
  /** RecognizedMode: The editor's recognized mode. */
  public RecognizedMode: 'Unknown' | 'Model' | 'Command' | 'Reporter' = 'Unknown';
  /** ContextErrors: Context errors detected during processing. */
  public ContextErrors: ContextError[] = [];
  /** EditorID: The id of the editor. */
  public EditorID: number = 0;
  /** Context: The context of the editor. */
  public Context: string = '';
  /** SetContext: Set the context of the editor. */
  public SetContext(Context: string): boolean {
    if (this.Context !== Context) {
      this.Context = Context;
      return true;
    } else return false;
  }
  // #endregion

  // #region "Version Control"
  /** SetDirty: Make the state dirty. */
  public SetDirty() {
    this.IsDirty = true;
  }
  /** GetDirty: Gets if the state is dirty. */
  public GetDirty() {
    return this.IsDirty;
  }
  // #endregion

  // #region "Parsing"
  /** ParseState: Parse the state from an editor state. */
  public ParseState(State: EditorState): StateNetLogo {
    if (!this.IsDirty) return this;
    // Clear some global states to avoid contamination
    this.Breeds = new Map<string, Breed>();
    this.Procedures = new Map<string, Procedure>();
    this.Extensions = [];
    this.Globals = [];
    this.ContextErrors = [];
    this.Breeds.set('turtle', new Breed('turtle', 'turtles', [], BreedType.Turtle));
    this.Breeds.set('patch', new Breed('patch', 'patches', [], BreedType.Patch));
    this.Breeds.set('link', new Breed('link', 'links', [], BreedType.UndirectedLink));
    // Cache for breed variables
    let tempBreedVars: Map<string, string[]> = new Map<string, string[]>();
    this.IsDirty = false;
    // Get the cursor
    const Cursor = GetCursorUntilMode(State);
    if (!Cursor) return this;
    // Recognize the mode
    switch (Cursor.node.name) {
      case 'Embedded':
        this.RecognizedMode = 'Command';
        break;
      case 'OnelineReporter':
        this.RecognizedMode = 'Reporter';
        break;
      case 'Normal':
        this.RecognizedMode = 'Model';
        break;
      default:
        this.RecognizedMode = 'Unknown';
        break;
    }
    // Parse the state
    if (this.RecognizedMode == 'Model') {
      if (!Cursor.firstChild()) return this;
      // Start parsing
      while (true) {
        // get extensions
        if (Cursor.node.name == 'Extensions') {
          Cursor.node.getChildren('Identifier').map((node) => {
            this.Extensions.push(getCodeName(State, node));
          });
        }
        // get global variables
        else if (Cursor.node.name == 'Globals') {
          this.Globals = [...this.Globals, ...this.getVariables(Cursor.node, State)];
        }
        // get breeds
        else if (Cursor.node.name == 'Breed') {
          // get breed type
          let breedType = BreedType.Turtle;
          Cursor.node.getChildren('BreedStr').map((node) => {
            let name = getCodeName(State, node);
            if (name.toLowerCase() == 'undirected-link-breed') {
              breedType = BreedType.UndirectedLink;
            } else if (name.toLowerCase() == 'directed-link-breed') {
              breedType = BreedType.DirectedLink;
            }
          });
          // get breed names
          const Plural = Cursor.node.getChildren('BreedPlural');
          const Singular = Cursor.node.getChildren('BreedSingular');
          if (Plural.length == 1 && Singular.length == 1) {
            let singular = getCodeName(State, Singular[0]);
            let plural = getCodeName(State, Plural[0]);
            let vars = tempBreedVars.get(plural) ?? [];
            let breed = new Breed(singular, plural, vars, breedType);
            this.Breeds.set(singular, breed);
          }
        }
        // get breed variables
        else if (Cursor.node.name == 'BreedsOwn') {
          let breedName = '';
          Cursor.node.getChildren('Own').map((node) => {
            breedName = getCodeName(State, node);
            breedName = breedName.substring(0, breedName.length - 4);
          });
          let breedVars = this.getVariables(Cursor.node, State);
          let found = false;
          for (let breed of this.Breeds.values()) {
            if (breed.Plural == breedName) {
              breed.Variables = breedVars;
              found = true;
            }
          }
          // If no breed is found, temporarily put it in the cache
          if (!found) tempBreedVars.set(breedName, breedVars);
        }
        // get procedures
        else if (Cursor.node.name == 'Procedure') {
          let procedure = this.gatherProcedure(Cursor.node, State);
          this.Procedures.set(procedure.Name, procedure);
        }
        if (!Cursor.nextSibling()) return this;
      }
    } else {
      // Collect information of one-line things
      if (this.RecognizedMode == 'Command') {
        let procedure = this.gatherEmbeddedProcedure(Cursor.node, State);
        this.Procedures.set(procedure.Name, procedure);
      } else if (this.RecognizedMode == 'Reporter') {
        let procedure = this.gatherOnelineProcedure(Cursor.node, State);
        this.Procedures.set(procedure.Name, procedure);
      }
      // Handle the context of one-line things
      let context = this.Preprocess.GetBreedContext(this.Context, false);
      this.combineContext(
        syntaxTree(State).cursor().node.firstChild?.firstChild ?? syntaxTree(State).cursor().node,
        State,
        context,
        new AgentContexts()
      );
    }
    return this;
  }

  /** gatherEmbeddedProcedure: Gather all information about a procedure in embedded mode. */
  private gatherEmbeddedProcedure(Node: SyntaxNode, State: EditorState): Procedure {
    let procedure = new Procedure();
    procedure.PositionStart = Node.from;
    procedure.PositionEnd = Node.to;

    procedure.IsCommand = true;
    procedure.Name = '⚠EmbeddedProcedure⚠';

    procedure.Arguments = [];
    procedure.Variables = this.getLocalVarsCommand(Node, State, false);
    procedure.AnonymousProcedures = this.gatherAnonProcedures(Node, State, procedure);
    procedure.Context = this.getContext(Node, State);
    procedure.CodeBlocks = this.gatherCodeBlocks(
      State,
      Node,
      procedure.Context,
      procedure.Variables,
      procedure.Arguments
    );
    return procedure;
  }

  /** gatherOnelineProcedure: Gather all information about a procedure in embedded mode. */
  private gatherOnelineProcedure(Node: SyntaxNode, State: EditorState): Procedure {
    let procedure = new Procedure();
    procedure.PositionStart = Node.from;
    procedure.PositionEnd = Node.to;
    procedure.IsCommand = false;
    procedure.Name = '⚠OnelineReporter⚠';
    procedure.Arguments = [];
    procedure.Variables = this.getLocalVarsCommand(Node, State, false);
    procedure.AnonymousProcedures = this.gatherAnonProcedures(Node, State, procedure);
    procedure.Context = this.getContext(Node, State);
    procedure.CodeBlocks = this.gatherCodeBlocks(
      State,
      Node,
      procedure.Context,
      procedure.Variables,
      procedure.Arguments
    );
    return procedure;
  }

  /** gatherProcedure: Gather all information about a procedure. */
  private gatherProcedure(Node: SyntaxNode, State: EditorState): Procedure {
    let procedure = new Procedure();
    procedure.PositionStart = Node.from;
    procedure.PositionEnd = Node.to;

    procedure.IsCommand = true;
    if (Node.getChild('To')) {
      procedure.IsCommand = getCodeName(State, Node.getChildren('To')[0].node).toLowerCase() == 'to';
    }

    Node.getChildren('ProcedureName').map((Children) => {
      procedure.Name = getCodeName(State, Children);
    });
    procedure.Arguments = this.getArgs(Node, State);
    procedure.Variables = this.getLocalVars(Node, State, false);
    procedure.AnonymousProcedures = this.gatherAnonProcedures(Node, State, procedure);
    procedure.Context = this.getContext(Node, State);
    procedure.CodeBlocks = this.gatherCodeBlocks(
      State,
      Node,
      procedure.Context,
      procedure.Variables,
      procedure.Arguments
    );
    this.checkReporterContext(Node, State);
    return procedure;
  }

  private checkReporterContext(Node: SyntaxNode, State: EditorState): void {
    Node.cursor().iterate((noderef) => {
      if (noderef.name == 'ReporterLeft1Args') {
        let left = null;
        let right = null;
        if (getCodeName(State, noderef) == 'of') {
          left = noderef.node.prevSibling;
          right = noderef.node.nextSibling;
        } else if (getCodeName(State, noderef) == 'with') {
          right = noderef.node.prevSibling;
          left = noderef.node.nextSibling;
        }
        if (left && right) {
          let breed = this.identifyBreed(right, State);
          let str = getCodeName(State, left);
          str = str.replace(/^\s*\[/, '');
          str = str.replace(/\]\s$/, '');
          str = str.replace(/\[[^\]]*\]/, '');
          if (breed) {
            for (let s of str.split(' ')) {
              if (this.Preprocess.BreedVarToPlurals.has(s.toLowerCase())) {
                let var_breed = this.Preprocess.BreedVarToPlurals.get(s.toLowerCase());
                let supertype = this.Preprocess.GetSuperType(breed);
                let context = new AgentContexts();

                if (supertype && var_breed && !var_breed.includes(breed) && !var_breed.includes(supertype)) {
                  if (supertype == 'turtles' && var_breed.includes('patches')) {
                    continue;
                  } else {
                    for (let b of var_breed) {
                      context = combineContexts(context, this.Preprocess.GetBreedContext(b, true));
                    }
                    this.ContextErrors.push(
                      new ContextError(left.from, left.to, this.Preprocess.GetBreedContext(breed, false), context, s)
                    );
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  /** getContext: Identify context of a block by looking at primitives and variable names. */
  private getContext(node: SyntaxNode, state: EditorState, priorContext_param?: AgentContexts): AgentContexts {
    let context = new AgentContexts();
    let priorContext = priorContext_param ?? new AgentContexts();
    let newContext = context;
    node.getChildren('ProcedureContent').map((node2) => {
      node2.getChildren('CommandStatement').map((node3) => {
        [priorContext, newContext] = this.combineContext(node3, state, priorContext, newContext);
      });
    });
    return priorContext;
  }

  /** combineContext: Identify context of a block by combining with the previous context. */
  public combineContext(node: SyntaxNode, state: EditorState, priorContext: AgentContexts, newContext: AgentContexts) {
    let cursor = node.cursor();
    cursor.iterate((child) => {
      let context: AgentContexts | undefined = undefined;
      let name: string | undefined = undefined;
      // console.log(getCodeName(state, child.node),child.name)
      if (child.name.includes('Block') || child.name == 'AnonymousProcedure') {
        return false;
      }
      if (
        (child.node.name.includes('Command') || child.node.name.includes('Reporter')) &&
        !child.node.name.includes('Commands') &&
        !child.node.name.includes('Reporters') &&
        !child.node.name.includes('Special') &&
        !child.node.name.includes('Content') &&
        !child.node.name.includes('Statement')
      ) {
        name = getCodeName(state, child.node);
        context = this.getPrimitiveContext(state, child.node, name);
      } else if (child.node.name == 'VariableDeclaration') {
        let n = child.node.getChild('SetVariable')?.getChild('VariableName');
        if (n) {
          name = getCodeName(state, n);
          if (['shape', 'breed', 'hidden?', 'label', 'label-color', 'color'].includes(name)) {
            context = new AgentContexts('-T-L');
          } else if (n?.getChild('PatchVar')) {
            context = new AgentContexts('-TP-');
          } else if (n?.getChild('TurtleVar')) {
            context = new AgentContexts('-T--');
          } else if (n?.getChild('LinkVar')) {
            context = new AgentContexts('---L');
          } else {
            context = this.Preprocess.GetBreedVariableContexts(name);
          }
        }
      } else if (child.node.name.includes('Special')) {
        name = getCodeName(state, child.node);
        if (
          !child.node.name.includes('Both') &&
          !child.node.name.includes('Turtle') &&
          !child.node.name.includes('Link')
        ) {
          context = this.Procedures.get(name)?.Context;
        } else {
          context = MatchBreed(name, this.Preprocess).Context;
        }
      }
      // Combine and check the context
      if (context) {
        newContext = combineContexts(context, priorContext);
        if (!noContext(newContext)) {
          priorContext = newContext;
          // console.log(priorContext,newContext,getCodeName(state, child.node),child.name)
        } else {
          this.ContextErrors.push(new ContextError(child.node.from, child.node.to, priorContext, context, name!));
        }
      }
    });
    // let child = cursor.firstChild();
    // while (child) {

    //   child = cursor.nextSibling();
    // }
    return [priorContext, newContext];
  }

  /** combineContext: Identify context of a block by combining with the previous context. */
  public OLDcombineContext(
    node: SyntaxNode,
    state: EditorState,
    priorContext: AgentContexts,
    newContext: AgentContexts
  ) {
    let cursor = node.cursor();
    let child = cursor.firstChild();
    while (child) {
      let context: AgentContexts | undefined = undefined;
      let name: string | undefined = undefined;
      if (
        (cursor.node.name.includes('Command') || cursor.node.name.includes('Reporter')) &&
        !cursor.node.name.includes('Commands') &&
        !cursor.node.name.includes('Reporters') &&
        !cursor.node.name.includes('Special')
      ) {
        name = getCodeName(state, cursor.node);
        context = this.getPrimitiveContext(state, cursor.node, name);
      } else if (cursor.node.name == 'VariableDeclaration') {
        let n = cursor.node.getChild('SetVariable')?.getChild('VariableName');
        if (n) {
          name = getCodeName(state, n);
          if (['shape', 'breed', 'hidden?', 'label', 'label-color', 'color'].includes(name)) {
            context = new AgentContexts('-T-L');
          } else if (n?.getChild('PatchVar')) {
            context = new AgentContexts('-TP-');
          } else if (n?.getChild('TurtleVar')) {
            context = new AgentContexts('-T--');
          } else if (n?.getChild('LinkVar')) {
            context = new AgentContexts('---L');
          } else {
            context = this.Preprocess.GetBreedVariableContexts(name);
          }
        }
      } else if (cursor.node.name.includes('Special')) {
        name = getCodeName(state, cursor.node);
        if (
          !cursor.node.name.includes('Both') &&
          !cursor.node.name.includes('Turtle') &&
          !cursor.node.name.includes('Link')
        ) {
          context = this.Procedures.get(name)?.Context;
        } else {
          context = MatchBreed(name, this.Preprocess).Context;
        }
      }
      // Combine and check the context
      if (context) {
        newContext = combineContexts(context, priorContext);
        if (!noContext(newContext)) {
          priorContext = newContext;
        } else {
          this.ContextErrors.push(new ContextError(cursor.node.from, cursor.node.to, priorContext, context, name!));
        }
      }
      child = cursor.nextSibling();
    }
    return [priorContext, newContext];
  }

  /** getPrimitiveContext: Identify context for a builtin primitive. */
  private getPrimitiveContext(state: EditorState, node: SyntaxNode, prim: string) {
    let prim_data = primitives.GetNamedPrimitive(prim);
    return prim_data?.AgentContext;
  }

  /** gatherCodeBlocks: Gather all information about code blocks inside a given node. */
  private gatherCodeBlocks(
    state: EditorState,
    node: SyntaxNode,
    parentContext: AgentContexts,
    vars: LocalVariable[],
    args: string[]
  ) {
    var blocks: CodeBlock[] = [];
    node.cursor().iterate((noderef) => {
      if (noderef.node.to > node.to) return false;
      if (noderef.name == 'Value')
        noderef.node.getChildren('CodeBlock').map((child) => {
          this.gatherCodeBlock(state, child, blocks, parentContext, vars, args);
        });
    });
    return blocks;
  }

  /** gatherCodeBlocks: Gather all information about a given code block. */
  private gatherCodeBlock(
    state: EditorState,
    node: SyntaxNode,
    blocks: CodeBlock[],
    parentContext: AgentContexts,
    vars: LocalVariable[],
    args: string[]
  ) {
    if (this.checkRanges(blocks, node)) return;
    let block = new CodeBlock();
    // Now it looks like Args/Value/CodeBlock
    let prim = this.getPrimitive(node.parent!.node.parent!.node, state);
    block.Primitive = prim.name;
    block.PositionStart = node.from;
    block.PositionEnd = node.to;
    block.InheritParentContext = prim.inheritParentContext;
    let originalContext = noContext(prim.context) || block.InheritParentContext ? parentContext : prim.context;
    block.Context = this.getContext(node, state, originalContext);
    // if (noContext(block.Context)) {
    //   console.log(
    //     parentContext,
    //     prim.context,
    //     noContext(prim.context) ? parentContext : prim.context,
    //     this.getContext(child, state)
    //   );
    // }
    block.Variables = vars.concat(this.getLocalVars(node.node, state, true));
    block.Arguments = args;
    block.Breed = prim.breed;
    block.CodeBlocks = this.gatherCodeBlocks(state, node, block.Context, block.Variables, block.Arguments);
    blocks.push(block);
  }

  /** getPrimitive: Gather information about the primitive whose argument is a code block. */
  private getPrimitive(node: SyntaxNode, state: EditorState) {
    let prim = {
      name: '',
      type: '',
      isSpecial: false,
      context: new AgentContexts('null'),
      firstArg: node.parent?.getChild('Arg'),
      breed: '',
      inheritParentContext: false,
    };
    let cursor = node.parent?.cursor();
    let ask = false;
    if (cursor?.firstChild()) {
      if (!['OpenParen', 'CloseParen', 'Reporters', 'Commands', 'Arg'].includes(cursor.node.name)) {
        prim.name = getCodeName(state, cursor.node);
        prim.type = cursor.node.name;
        if (prim.name == 'ask') {
          ask = true;
        }
      }
      while (cursor.nextSibling() && (prim.name == '' || ask)) {
        if (!['OpenParen', 'CloseParen', 'Reporters', 'Commands', 'Arg'].includes(cursor.node.name)) {
          prim.name = getCodeName(state, cursor.node);
          prim.type = cursor.node.name;
        } else if (cursor.node.name == 'Arg' && ask) {
          prim.breed = this.identifyBreed(cursor.node, state) ?? prim.breed;
          ask = false;
        }
      }
    }
    if (prim.type.includes('Special')) {
      prim.isSpecial = true;
      prim.breed = MatchBreed(prim.name, this.Preprocess).Plural ?? '';
    }
    if (prim.breed != '') {
      prim.context = new AgentContexts('null');
      if (this.Preprocess.PluralBreeds.has(prim.breed)) {
        prim.context = this.Preprocess.GetBreedContext(prim.breed, false);
      } else if (this.Preprocess.SingularBreeds.has(prim.breed)) {
        prim.context = this.Preprocess.GetBreedContext(this.Preprocess.SingularToPlurals.get(prim.breed)!, false);
      }
    } else {
      let primitive = primitives.GetNamedPrimitive(prim.name);
      prim.context = primitive?.BlockContext ?? new AgentContexts('null');
      prim.inheritParentContext = primitive?.InheritParentContext ?? false;
    }
    if (noContext(prim.context)) Log('No available context: ' + prim.name);
    return prim;
  }

  /** identifyBreed: Identify the breed context of a given node. */
  private identifyBreed(Node: SyntaxNode, State: EditorState): string | undefined {
    let str = getCodeName(State, Node);
    if (this.Preprocess.PluralBreeds.has(str)) return str;
    // If we find a special name, return it
    var breed: string | undefined = this.Preprocess.GetReporterBreed(str.split(' ')[0].trim());
    if (breed) return breed;
    // If we find a breed name, return it
    Node.cursor().iterate((noderef) => {
      if (breed != undefined) return false;
      let str = getCodeName(State, noderef);
      if (str.startsWith('[')) return false;
      if (this.Preprocess.PluralBreeds.has(str)) {
        breed = str;
        return false;
      } else if (this.Preprocess.SingularBreeds.has(str)) {
        breed = this.Preprocess.SingularToPlurals.get(str)!;
        return false;
      }
    });
    return breed;
  }

  /** searchAnonProcedure: Look for nested anonymous procedures within a node and procedure. */
  private gatherAnonProcedures(node: SyntaxNode, State: EditorState, procedure: Procedure): Procedure[] {
    let anonymousProcedures: Procedure[] = [];
    node.cursor().iterate((noderef) => {
      if (noderef.node.to > node.to) {
        return false;
      }
      if (
        node != noderef.node &&
        (noderef.name == 'AnonymousProcedure' || noderef.name == 'ShortAnonymousProcedure') &&
        !this.checkRanges(anonymousProcedures, noderef.node)
      ) {
        anonymousProcedures.push(this.gatherAnonProcedure(noderef, State, procedure));
      }
    });
    return anonymousProcedures;
  }

  /** checkRanges: Identify whether a node is inside the set of procedures or code blocks. */
  private checkRanges(procedures: Procedure[] | CodeBlock[], node: SyntaxNode): boolean {
    for (let p of procedures) {
      if (p.PositionStart <= node.from && p.PositionEnd >= node.to) return true;
    }
    return false;
  }

  /** getAnonProcedure: Gather information about an anonymous procedure. */
  private gatherAnonProcedure(noderef: SyntaxNodeRef, State: EditorState, procedure: Procedure): Procedure {
    let anonProc = new Procedure();
    anonProc.PositionStart = noderef.from;
    anonProc.PositionEnd = noderef.to;
    anonProc.Variables = procedure.Variables;
    anonProc.IsAnonymous = true;
    anonProc.Name = '';
    anonProc.IsCommand = noderef.node.getChildren('ProcedureContent').length > 0;
    let args: string[] = [];
    let Node = noderef.node;
    Node.getChildren('AnonArguments').map((node) => {
      node.getChildren('Identifier').map((subnode) => {
        args.push(getCodeName(State, subnode));
      });
      node.getChildren('Arguments').map((subnode) => {
        subnode.getChildren('Identifier').map((subsubnode) => {
          args.push(getCodeName(State, subsubnode));
        });
      });
    });
    anonProc.Arguments = args;
    anonProc.Variables = anonProc.Variables.concat(this.getLocalVars(Node, State, true));
    anonProc.AnonymousProcedures = this.gatherAnonProcedures(Node, State, anonProc);
    return anonProc;
  }

  /** getLocalVars: Collect local variables within a node. */
  private getLocalVars(Node: SyntaxNode, State: EditorState, isAnon: Boolean): LocalVariable[] {
    let localVars: LocalVariable[] = [];
    Node.getChildren('ProcedureContent').map((node1) => {
      localVars = localVars.concat(this.getLocalVarsCommand(node1, State, isAnon));
    });
    return localVars;
  }

  /** getLocalVarsCommand: Collect local variables within a command statement. */
  private getLocalVarsCommand(Node: SyntaxNode, State: EditorState, isAnon?: Boolean): LocalVariable[] {
    let localVars: LocalVariable[] = [];
    Node.getChildren('CommandStatement').map((node2) => {
      node2.getChildren('VariableDeclaration').map((node3) => {
        node3.getChildren('NewVariableDeclaration').map((node4) => {
          node4.getChildren('Identifier').map((node5) => {
            let variable = new LocalVariable(getCodeName(State, node5), 1, node5.from);
            localVars.push(variable);
          });
          node4.getChildren('UnsupportedPrim').map((node5) => {
            let variable = new LocalVariable(getCodeName(State, node5), 1, node5.from);
            localVars.push(variable);
          });
        });
      });
    });
    return localVars;
  }

  /** getVariables: Get global or breed variables. */
  private getVariables(Node: SyntaxNode, State: EditorState): string[] {
    let vars: string[] = [];
    Node.cursor().iterate((noderef) => {
      if (noderef.node.to > Node.to) {
        return false;
      }
      if (
        ![
          'OpenParen',
          'CloseParen',
          'OpenBracket',
          'CloseBracket',
          'LineComment',
          'BreedsOwn',
          'Own',
          'GlobalStr',
          'ExtensionStr',
          'BreedDeclarative',
          'Globals',
          'Breed',
          'Extensions',
        ].includes(noderef.name)
      ) {
        var Text = getCodeName(State, noderef.node);
        if (Text !== '' && !Text.includes('\n')) vars.push(getCodeName(State, noderef.node));
      }
    });
    return [...new Set(vars)];
  }

  /** getArgs: Identify arguments for a given procedure. */
  private getArgs(Node: SyntaxNode, State: EditorState): string[] {
    const args: string[] = [];
    Node.getChildren('Arguments').map((node) => {
      node.getChildren('Identifier').map((subnode) => {
        args.push(getCodeName(State, subnode));
      });
    });
    return args;
  }
  // #endregion
}

/** StateExtension: Extension for managing the editor state.  */
const stateExtension = StateField.define<StateNetLogo>({
  create: (State) => {
    var NewState = new StateNetLogo();
    NewState.SetDirty();
    return NewState;
  },
  update: (Original: StateNetLogo, Transaction: Transaction) => {
    if (Transaction.docChanged) {
      Original.SetDirty();
      Log(Original);
    }
    return Original;
  },
});

export { stateExtension };
