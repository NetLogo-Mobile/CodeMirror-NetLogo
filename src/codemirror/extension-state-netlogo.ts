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
import { combineContexts, noContext } from './utils/context-utils';
import { getBreedName } from './utils/breed-utils';
import { SyntaxNode, SyntaxNodeRef } from '@lezer/common';
import { RuntimeError } from '../lang/linters/runtime-linter';
import { PrimitiveManager } from '../lang/primitives/primitives';
import { ParseMode } from '../editor-config';
import { Log } from './utils/debug-utils';
import { GetCursorUntilMode } from '../lang/linters/utils/cursors';

let primitives = PrimitiveManager;

/** StateNetLogo: The second-pass editor state for the NetLogo Language. */
export class StateNetLogo {
  // #region "Information"
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
    if (this.RecognizedMode == 'Model') {
      if (!Cursor.firstChild()) return this;
      // Start parsing
      while (true) {
        // get extensions
        if (Cursor.node.name == 'Extensions') {
          Cursor.node.getChildren('Identifier').map((node) => {
            this.Extensions.push(this.getText(State, node));
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
            let name = this.getText(State, node);
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
            let singular = this.getText(State, Singular[0]);
            let plural = this.getText(State, Plural[0]);
            let vars = tempBreedVars.get(plural) ?? [];
            let breed = new Breed(singular, plural, vars, breedType);
            this.Breeds.set(singular, breed);
          }
        }
        // get breed variables
        else if (Cursor.node.name == 'BreedsOwn') {
          let breedName = '';
          Cursor.node.getChildren('Own').map((node) => {
            breedName = this.getText(State, node);
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
          if (!found) {
            tempBreedVars.set(breedName, breedVars);
          }
        }
        // get procedures
        else if (Cursor.node.name == 'Procedure') {
          let procedure = this.getProcedure(Cursor.node, State);
          this.Procedures.set(procedure.Name, procedure);
        }
        if (!Cursor.nextSibling()) return this;
      }
    } else if (this.RecognizedMode == 'Command') {
      let procedure = [];
    }
    return this;
  }

  private parseCommand(State: EditorState, node: SyntaxNode): Procedure {
    let procedure = new Procedure();
    procedure.PositionStart = node.from;
    procedure.PositionEnd = node.to;
    procedure.IsCommand = true;
    procedure.Name = '⚠EmbeddedMode⚠';
    procedure.Arguments = [];
    procedure.Variables = this.getLocalVarsCommand(node, State);

    return procedure;
  }

  /** getProcedure: Gather all information about a procedure. */
  private getProcedure(node: SyntaxNode, State: EditorState): Procedure {
    let procedure = new Procedure();
    procedure.PositionStart = node.from;
    procedure.PositionEnd = node.to;

    procedure.IsCommand = true;
    if (node.getChild('To')) {
      procedure.IsCommand = this.getText(State, node.getChildren('To')[0].node).toLowerCase() == 'to';
    }

    node.getChildren('ProcedureName').map((node) => {
      procedure.Name = this.getText(State, node);
    });
    procedure.Arguments = this.getArgs(node, State);
    procedure.Variables = this.getLocalVars(node, State, false);
    procedure.AnonymousProcedures = this.searchAnonProcedure(node, State, procedure);
    procedure.Context = this.getContext(node, State);
    procedure.CodeBlocks = this.getCodeBlocks(node, State, procedure.Context, procedure.Variables, procedure.Arguments);
    return procedure;
  }

  /** getContext: Identify context of a block by looking at primitives and variable names. */
  private getContext(node: SyntaxNode, state: EditorState) {
    let context = new AgentContexts();
    let priorContext = new AgentContexts();
    let newContext = context;
    node.getChildren('ProcedureContent').map((node2) => {
      node2.getChildren('CommandStatement').map((node3) => {
        let cursor = node3.cursor();
        let child = cursor.firstChild();
        while (child) {
          if (
            cursor.node.name.includes('Command') &&
            !cursor.node.name.includes('Commands') &&
            !cursor.node.name.includes('Special')
          ) {
            let c = this.getPrimitiveContext(cursor.node, state);
            if (c) {
              newContext = combineContexts(c, priorContext);
              if (!noContext(newContext)) {
                priorContext = newContext;
              } else {
                this.ContextErrors.push(
                  new ContextError(
                    cursor.node.from,
                    cursor.node.to,
                    priorContext,
                    c,
                    state.sliceDoc(cursor.node.from, cursor.node.to)
                  )
                );
              }
            }
          } else if (cursor.node.name == 'VariableDeclaration') {
            let n = cursor.node.getChild('SetVariable')?.getChild('VariableName');
            let c = new AgentContexts();
            let name = state.sliceDoc(n?.from, n?.to);
            if (['shape', 'breed', 'hidden?', 'label', 'label-color', 'color'].includes(name)) {
              c = new AgentContexts('-T-L');
            } else if (n?.getChild('PatchVar')) {
              c = new AgentContexts('-TP-');
            } else if (n?.getChild('TurtleVar')) {
              c = new AgentContexts('-T--');
            } else if (n?.getChild('LinkVar')) {
              c = new AgentContexts('---L');
            } else if (n) {
              for (let breed of this.Breeds.values()) {
                if (breed.Variables.includes(name)) {
                  c = this.getBreedContext(breed);
                  // if (breed.IsLinkBreed) {
                  //   c = new AgentContexts('---L');
                  // } else if (breed.Singular == 'patch') {
                  //   c = new AgentContexts('-TP-');
                  // } else {
                  //   c = new AgentContexts('-T--');
                  // }
                }
              }
            }
            newContext = combineContexts(c, priorContext);
            if (!noContext(newContext)) {
              priorContext = newContext;
            } else {
              this.ContextErrors.push(new ContextError(cursor.node.from, cursor.node.to, priorContext, c, name));
            }
            //context = combineContexts(c, context);
          }
          child = cursor.nextSibling();
        }
      });
    });
    return priorContext;
  }

  private getContextCommandStatement(node: SyntaxNode, state: EditorState) {
    let context = new AgentContexts();
    let priorContext = new AgentContexts();
    let newContext = context;
    node.getChildren('CommandStatement').map((node3) => {
      let cursor = node3.cursor();
      let child = cursor.firstChild();
      while (child) {
        if (
          cursor.node.name.includes('Command') &&
          !cursor.node.name.includes('Commands') &&
          !cursor.node.name.includes('Special')
        ) {
          let c = this.getPrimitiveContext(cursor.node, state);
          if (c) {
            newContext = combineContexts(c, priorContext);
            if (!noContext(newContext)) {
              priorContext = newContext;
            } else {
              this.ContextErrors.push(
                new ContextError(
                  cursor.node.from,
                  cursor.node.to,
                  priorContext,
                  c,
                  state.sliceDoc(cursor.node.from, cursor.node.to)
                )
              );
            }
          }
        } else if (cursor.node.name == 'VariableDeclaration') {
          let n = cursor.node.getChild('SetVariable')?.getChild('VariableName');
          let c = new AgentContexts();
          let name = state.sliceDoc(n?.from, n?.to);
          if (['shape', 'breed', 'hidden?', 'label', 'label-color', 'color'].includes(name)) {
            c = new AgentContexts('-T-L');
          } else if (n?.getChild('PatchVar')) {
            c = new AgentContexts('-TP-');
          } else if (n?.getChild('TurtleVar')) {
            c = new AgentContexts('-T--');
          } else if (n?.getChild('LinkVar')) {
            c = new AgentContexts('---L');
          } else if (n) {
            for (let breed of this.Breeds.values()) {
              if (breed.Variables.includes(name)) {
                c = this.getBreedContext(breed);
                // if (breed.IsLinkBreed) {
                //   c = new AgentContexts('---L');
                // } else if (breed.Singular == 'patch') {
                //   c = new AgentContexts('-TP-');
                // } else {
                //   c = new AgentContexts('-T--');
                // }
              }
            }
          }
          newContext = combineContexts(c, priorContext);
          if (!noContext(newContext)) {
            priorContext = newContext;
          } else {
            this.ContextErrors.push(new ContextError(cursor.node.from, cursor.node.to, priorContext, c, name));
          }
          //context = combineContexts(c, context);
        }
        child = cursor.nextSibling();
      }
    });
    return priorContext;
  }

  /** getPrimitiveContext: Identify context for a builtin primitive. */
  private getPrimitiveContext(node: SyntaxNode, state: EditorState) {
    let prim = state.sliceDoc(node.from, node.to);
    let prim_data = primitives.GetNamedPrimitive(prim);
    return prim_data?.AgentContext;
  }

  /** getCodeBlocks: Gather all information about a given code block. */
  private getCodeBlocks(
    node: SyntaxNode,
    state: EditorState,
    parentContext: AgentContexts,
    vars: LocalVariable[],
    args: string[]
  ) {
    let blocks: CodeBlock[] = [];
    node.cursor().iterate((noderef) => {
      if (noderef.node.to > node.to) {
        return false;
      }
      if (noderef.name == 'Arg') {
        noderef.node.getChildren('CodeBlock').map((child) => {
          if (!this.checkRanges(blocks, child)) {
            let block = new CodeBlock();
            let prim = this.getPrimitive(noderef.node, state);
            block.Primitive = prim.name;
            block.PositionStart = child.from;
            block.PositionEnd = child.to;
            block.InheritParentContext = prim.inheritParentContext;
            block.Context = combineContexts(
              this.getContext(child, state),
              noContext(prim.context) ? parentContext : prim.context
            );
            // if (noContext(block.Context)) {
            //   console.log(
            //     parentContext,
            //     prim.context,
            //     noContext(prim.context) ? parentContext : prim.context,
            //     this.getContext(child, state)
            //   );
            // }
            block.Variables = vars.concat(this.getLocalVars(child.node, state, true));
            block.Arguments = args;
            block.CodeBlocks = this.getCodeBlocks(child.node, state, block.Context, block.Variables, block.Arguments);
            block.Breed = prim.breed;
            blocks.push(block);
          }
        });
      }
    });
    return blocks;
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
        prim.name = state.sliceDoc(cursor.node.from, cursor.node.to).toLowerCase();
        prim.type = cursor.node.name;
        if (prim.name == 'ask') {
          ask = true;
        }
      }
      while (cursor.nextSibling() && prim.name == '') {
        if (!['OpenParen', 'CloseParen', 'Reporters', 'Commands', 'Arg'].includes(cursor.node.name)) {
          prim.name = state.sliceDoc(cursor.node.from, cursor.node.to);
          prim.type = cursor.node.name;
        } else if (cursor.node.name == 'Arg' && ask) {
          prim.breed = state.sliceDoc(cursor.node.from, cursor.node.to);
          ask = false;
        }
      }
    }
    if (prim.type.includes('Special')) {
      prim.isSpecial = true;
      prim.breed = getBreedName(prim.name).breed ?? '';
    }
    if (prim.breed != '') {
      prim.context = new AgentContexts('null');
      if (prim.breed != '') {
        let breed = null;
        for (let b of this.Breeds.values()) {
          if (prim.breed.toLowerCase() == b.Singular || prim.breed.toLowerCase() == b.Plural) {
            breed = b;
          }
        }
        if (breed) {
          prim.context = this.getBreedContext(breed);
          // if (breed.IsLinkBreed) {
          //   prim.context = new AgentContexts('---L');
          // } else if (breed.Singular == 'patch') {
          //   prim.context = new AgentContexts('-TP-');
          // } else {
          //   prim.context = new AgentContexts('-T--');
          // }
        }
      }
    } else {
      let primitive = primitives.GetNamedPrimitive(prim.name);
      prim.context = primitive?.BlockContext ?? new AgentContexts('null');
      prim.inheritParentContext = primitive?.InheritParentContext ?? false;
    }
    if (noContext(prim.context)) {
      Log('No available context: ' + prim);
    }
    return prim;
  }

  private getBreedContext(breed: Breed) {
    if (breed.BreedType == BreedType.DirectedLink || breed.BreedType == BreedType.UndirectedLink) {
      return new AgentContexts('---L');
    } else if (breed.Singular == 'patch') {
      return new AgentContexts('-TP-');
    } else {
      return new AgentContexts('-T--');
    }
  }

  /** searchAnonProcedure: Look for nested anonymous procedures within a node and procedure. */
  private searchAnonProcedure(node: SyntaxNode, State: EditorState, procedure: Procedure): Procedure[] {
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
        anonymousProcedures.push(this.getAnonProcedure(noderef, State, procedure));
      }
    });
    return anonymousProcedures;
  }

  /** checkRanges: Identify whether a node is inside the set of procedures or code blocks. */
  private checkRanges(procedures: Procedure[] | CodeBlock[], node: SyntaxNode): boolean {
    let included = false;
    for (let p of procedures) {
      if (p.PositionStart <= node.from && p.PositionEnd >= node.to) {
        included = true;
      }
    }
    return included;
  }

  /** getAnonProcedure: Gather information about the anonymous procedure. */
  private getAnonProcedure(noderef: SyntaxNodeRef, State: EditorState, procedure: Procedure): Procedure {
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
        args.push(this.getText(State, subnode));
      });
      node.getChildren('Arguments').map((subnode) => {
        subnode.getChildren('Identifier').map((subsubnode) => {
          args.push(this.getText(State, subsubnode));
        });
      });
    });
    anonProc.Arguments = args;
    anonProc.Variables = anonProc.Variables.concat(this.getLocalVars(Node, State, true));

    anonProc.AnonymousProcedures = this.searchAnonProcedure(Node, State, anonProc);
    return anonProc;
  }

  /** getText: Get text for a given node. */
  private getText(State: EditorState, Node: SyntaxNode): string {
    return State.sliceDoc(Node.from, Node.to).toLowerCase();
  }

  /** getLocalVars: Collect local variables within a node. */
  private getLocalVars(Node: SyntaxNode, State: EditorState, isAnon: Boolean): LocalVariable[] {
    let localVars: LocalVariable[] = [];
    Node.getChildren('ProcedureContent').map((node1) => {
      localVars = localVars.concat(this.getLocalVarsCommand(node1, State, isAnon));
    });
    return localVars;
  }

  private getLocalVarsCommand(Node: SyntaxNode, State: EditorState, isAnon?: Boolean): LocalVariable[] {
    let localVars: LocalVariable[] = [];
    Node.getChildren('CommandStatement').map((node2) => {
      node2.getChildren('VariableDeclaration').map((node3) => {
        node3.getChildren('NewVariableDeclaration').map((node4) => {
          node4.getChildren('Identifier').map((node5) => {
            let variable = new LocalVariable(this.getText(State, node5), 1, node5.from);
            localVars.push(variable);
          });
          node4.getChildren('UnsupportedPrim').map((node5) => {
            let variable = new LocalVariable(this.getText(State, node5), 1, node5.from);
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
        var Text = this.getText(State, noderef.node);
        if (Text !== '' && !Text.includes('\n')) vars.push(this.getText(State, noderef.node));
      }
    });
    return [...new Set(vars)];
  }

  /** getArgs: Identify arguments for a given procedure. */
  private getArgs(Node: SyntaxNode, State: EditorState): string[] {
    const args: string[] = [];
    Node.getChildren('Arguments').map((node) => {
      node.getChildren('Identifier').map((subnode) => {
        args.push(this.getText(State, subnode));
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
