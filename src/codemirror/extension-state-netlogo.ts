import { StateField, Transaction, EditorState } from '@codemirror/state';

import { syntaxTree } from '@codemirror/language';
import {
  AnonymousProcedure,
  Breed,
  LocalVariable,
  Procedure,
  CodeBlock,
  AgentContexts,
} from '../lang/classes';
import { SyntaxNode, SyntaxNodeRef } from '@lezer/common';
import { RuntimeError } from '../lang/linters/runtime-linter';
import { PrimitiveManager } from '../lang/primitives/primitives';

let primitives = PrimitiveManager;

/** StateNetLogo: Editor state for the NetLogo Language. */
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
  /** Version: Version of the state (for linter cache). */
  private Version: number = 0;
  /** Mode: The editor's mode: normal, oneline, or embedded. */
  public Mode: string = 'normal';
  // #endregion

  // #region "Utilities"
  /** GetBreedNames: Get names related to breeds. */
  public GetBreedNames(): string[] {
    var breedNames: string[] = [];
    for (let breed of this.Breeds.values()) {
      breedNames.push(breed.Singular);
      breedNames.push(breed.Plural);
    }
    return breedNames;
  }
  public GetBreeds(): Breed[] {
    var breedList: Breed[] = [];
    for (let breed of this.Breeds.values()) {
      breedList.push(breed);
    }
    return breedList;
  }
  /** GetBreedVariables: Get variable names related to breeds. */
  public GetBreedVariables(): string[] {
    var breedNames: string[] = [];
    for (let breed of this.Breeds.values()) {
      breedNames = breedNames.concat(breed.Variables);
    }
    return breedNames;
  }
  /** GetBreedFromVariable: Find the breed which defines a certain variable. */
  public GetBreedFromVariable(varName: string): string | null {
    for (let breed of this.Breeds.values()) {
      if (breed.Variables.includes(varName)) return breed.Plural;
    }
    return null;
  }

  public GetBreedFromProcedure(term: string): string | null {
    let breed = '';
    for (let b of this.GetBreedNames()) {
      if (term.includes(b) && b.length > breed.length) {
        breed = b;
      }
    }
    return breed;
  }
  /** GetProcedureFromVariable: Find the procedure that defines a certain variable. */
  public GetProcedureFromVariable(
    varName: string,
    from: number,
    to: number
  ): string | null {
    for (let proc of this.Procedures.values()) {
      if (proc.PositionEnd < from || proc.PositionStart > to) continue;
      // Check the argument list in a procedure
      if (proc.Arguments.includes(varName)) return proc.Name;
      // Check the local variable list in a procedure
      for (let localVar of proc.Variables) {
        if (localVar.Name == varName && localVar.CreationPos <= to)
          return proc.Name;
      }
      // Check the anonymous arguments in a procedure
      for (let anonProc of proc.AnonymousProcedures) {
        if (anonProc.PositionEnd > from || anonProc.PositionStart < to)
          continue;
        if (anonProc.Arguments.includes(varName))
          return '{anonymous},' + proc.Name;
        for (let localVar of anonProc.Variables) {
          if (localVar.Name == varName && localVar.CreationPos <= to)
            return '{anonymous},' + proc.Name;
        }
      }
    }
    return null;
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
  /** GetVersion: Get version of the state. */
  public GetVersion(): number {
    return this.Version;
  }
  /** IncVersion: Increase version of the state. */
  public IncVersion(): number {
    return ++this.Version;
  }
  // #endregion

  // #region "Parsing"
  /** ParseState: Parse the state from an editor state. */
  public ParseState(State: EditorState): StateNetLogo {
    if (!this.IsDirty) return this;
    const Cursor = syntaxTree(State).cursor();
    if (!Cursor.firstChild()) return this;
    // Clear some global states to avoid contamination
    this.Breeds = new Map<string, Breed>();
    this.Procedures = new Map<string, Procedure>();
    this.Extensions = [];
    this.Globals = [];
    this.Breeds.set('turtle', new Breed('turtle', 'turtles', [], false));
    this.Breeds.set('patch', new Breed('patch', 'patches', [], false));
    this.Breeds.set('link', new Breed('link', 'links', [], true));
    // Start parsing
    while (true) {
      // get extensions
      if (Cursor.node.name == 'Extensions') {
        Cursor.node.getChildren('Extension').map((node) => {
          this.Extensions.push(this.getText(State, node));
        });
      }
      // get global variables
      else if (Cursor.node.name == 'Globals') {
        this.Globals = this.getVariables(Cursor.node, State);
      }
      // get breeds
      else if (Cursor.node.name == 'Breed') {
        const Plural = Cursor.node.getChildren('BreedPlural');
        const Singular = Cursor.node.getChildren('BreedSingular');
        let isLinkBreed = false;
        Cursor.node.getChildren('BreedDeclarative').map((node) => {
          isLinkBreed = node.getChildren('BreedStr').length == 1;
        });
        if (Plural.length == 1 && Singular.length == 1) {
          let singular = this.getText(State, Singular[0]);
          let breed = new Breed(
            singular,
            this.getText(State, Plural[0]),
            [],
            isLinkBreed
          );
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
        for (let breed of this.Breeds.values()) {
          if (breed.Plural == breedName) {
            breed.Variables = breedVars;
          }
        }
      }
      // get procedures
      else if (Cursor.node.name == 'Procedure') {
        let procedure = this.getProcedure(Cursor.node, State);
        this.Procedures.set(procedure.Name, procedure);
      }

      if (!Cursor.nextSibling()) {
        this.IncVersion();
        this.IsDirty = false;
        return this;
      }
    }
  }

  private getProcedure(node: SyntaxNode, State: EditorState): Procedure {
    let procedure = new Procedure();
    procedure.PositionStart = node.from;
    procedure.PositionEnd = node.to;
    procedure.IsCommand =
      this.getText(State, node.getChildren('To')[0].node).toLowerCase() == 'to';
    node.getChildren('ProcedureName').map((node) => {
      procedure.Name = this.getText(State, node);
    });
    procedure.Arguments = this.getArgs(node, State);
    procedure.Variables = this.getLocalVars(node, State, false);
    procedure.AnonymousProcedures = this.searchAnonProcedure(
      node,
      State,
      procedure
    );
    procedure.Context = this.getContext(node, State);
    procedure.CodeBlocks = this.getCodeBlocks(
      node,
      State,
      procedure.Context,
      procedure.Variables,
      procedure.Arguments
    );
    return procedure;
  }

  private getContext(node: SyntaxNode, state: EditorState) {
    let context = new AgentContexts();
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
              context = this.combineContexts(c, context);
            }
          } else if (cursor.node.name == 'VariableDeclaration') {
            let n = cursor.node
              .getChild('SetVariable')
              ?.getChild('VariableName');
            let c = new AgentContexts();
            if (n?.getChild('PatchVar')) {
              c = new AgentContexts('-TP-');
            } else if (n?.getChild('TurtleVar')) {
              c = new AgentContexts('-T--');
            } else if (n?.getChild('LinkVar')) {
              c = new AgentContexts('---L');
            } else if (n) {
              let name = state.sliceDoc(n.from, n.to);
              for (let breed of this.Breeds.values()) {
                if (breed.Variables.includes(name)) {
                  if (breed.isLinkBreed) {
                    c = new AgentContexts('---L');
                  } else if (breed.Singular == 'patch') {
                    c = new AgentContexts('-TP-');
                  } else {
                    c = new AgentContexts('-T--');
                  }
                }
              }
            }
            context = this.combineContexts(c, context);
          }
          child = cursor.nextSibling();
        }
      });
    });
    return context;
  }

  private getPrimitiveContext(node: SyntaxNode, state: EditorState) {
    let prim = state.sliceDoc(node.from, node.to);
    let prim_data = primitives.GetNamedPrimitive(prim);
    return prim_data?.AgentContext;
  }

  public combineContexts(c1: AgentContexts, c2: AgentContexts) {
    let final = new AgentContexts();
    if (!c1.Observer || !c2.Observer) {
      final.Observer = false;
    }
    if (!c1.Turtle || !c2.Turtle) {
      final.Turtle = false;
    }
    if (!c1.Patch || !c2.Patch) {
      final.Patch = false;
    }
    if (!c1.Link || !c2.Link) {
      final.Link = false;
    }
    return final;
  }

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
            block.Context = this.combineContexts(
              this.getContext(child, state),
              this.noContext(prim.context) ? parentContext : prim.context
            );
            if (this.noContext(block.Context)) {
              console.log(
                parentContext,
                prim.context,
                this.noContext(prim.context) ? parentContext : prim.context,
                this.getContext(child, state)
              );
            }
            block.Variables = vars.concat(
              this.getLocalVars(child.node, state, true)
            );
            block.Arguments = args;
            block.CodeBlocks = this.getCodeBlocks(
              child.node,
              state,
              block.Context,
              block.Variables,
              block.Arguments
            );
            block.Breed = prim.breed;
            blocks.push(block);
          }
        });
      }
    });
    return blocks;
  }

  private getBreedName(value: string) {
    let result = this.checkBreedLike(value);
    let str = null;
    if (result[0]) {
      //pull out name of possible intended breed
      let first = value.indexOf('-');
      let last = value.lastIndexOf('-');
      if (result[1] == 'Last') {
        str = value.substring(first + 1);
      } else if (result[1] == 'First') {
        str = value.substring(0, last);
      } else if (result[1] == 'Middle') {
        str = value.substring(first + 1, last);
      } else {
        str = value.substring(first + 1, value.length - 1);
      }
    }
    return str;
  }

  public noContext(c: AgentContexts) {
    return !c.Observer && !c.Turtle && !c.Patch && !c.Link;
  }

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
    if (cursor?.firstChild()) {
      if (
        !['OpenParen', 'CloseParen', 'Reporters', 'Commands', 'Arg'].includes(
          cursor.node.name
        )
      ) {
        prim.name = state.sliceDoc(cursor.node.from, cursor.node.to);
        prim.type = cursor.node.name;
      }
      while (cursor.nextSibling() && prim.name == '') {
        if (
          !['OpenParen', 'CloseParen', 'Reporters', 'Commands', 'Arg'].includes(
            cursor.node.name
          )
        ) {
          prim.name = state.sliceDoc(cursor.node.from, cursor.node.to);
          prim.type = cursor.node.name;
        }
      }
    }
    if (prim.type.includes('Special')) {
      prim.isSpecial = true;
      prim.breed = this.getBreedName(prim.name) ?? '';
      prim.context = new AgentContexts('null');
      if (prim.breed != '') {
        let breed = null;
        for (let b of this.Breeds.values()) {
          if (
            prim.breed.toLowerCase() == b.Singular ||
            prim.breed.toLowerCase() == b.Plural
          ) {
            breed = b;
          }
        }
        if (breed) {
          if (breed.isLinkBreed) {
            prim.context = new AgentContexts('---L');
          } else if (breed.Singular == 'patch') {
            prim.context = new AgentContexts('-TP-');
          } else {
            prim.context = new AgentContexts('-T--');
          }
        }
      }
    } else {
      let primitive = primitives.GetNamedPrimitive(prim.name);
      prim.context = primitive?.BlockContext ?? new AgentContexts('null');
      prim.inheritParentContext = primitive?.InheritParentContext ?? false;
    }
    if (this.noContext(prim.context)) {
      console.log(prim);
    }
    return prim;
  }

  //identify if the term looks like a breed procedure (e.g. "create-___")
  //If so, also identify where to look within the term to find the intended breed name
  public checkBreedLike = function (str: string) {
    let result = false;
    let location = '';
    if (str.match(/[^\s]+-(at)/)) {
      result = true;
      location = 'First';
    } else if (str.match(/[^\s]+-here/)) {
      result = true;
      location = 'First';
    } else if (str.match(/[^\s]+-neighbors/)) {
      result = true;
      location = 'First';
    } else if (str.match(/[^\s]+-on/)) {
      result = true;
      location = 'First';
    } else if (str.match(/[^\s]+-(with|neighbor\\?)/)) {
      result = true;
      location = 'First';
    } else if (str.match(/^(my|my-in|my-out)-[^\s]+/)) {
      result = true;
      location = 'Last';
    } else if (str.match(/^is-[^\s]+\\?$/)) {
      result = true;
      location = 'Question';
    } else if (str.match(/^in-[^\s]+-from$/)) {
      result = true;
      location = 'Middle';
    } else if (str.match(/^(in|out)-[^\s]+-(neighbors)$/)) {
      result = true;
      location = 'Middle';
    } else if (str.match(/^(in|out)-[^\s]+-(neighbor\\?)$/)) {
      result = true;
      location = 'Middle';
    } else if (str.match(/^out-[^\s]+-to$/)) {
      result = true;
      location = 'Middle';
    } else if (str.match(/^create-[^\s]+-(to|from|with)$/)) {
      result = true;
      location = 'Middle';
    } else if (str.match(/^(hatch|sprout|create|create-ordered)-[^\s]+/)) {
      result = true;
      location = 'Last';
    }
    return [result, location];
  };

  private searchAnonProcedure(
    node: SyntaxNode,
    State: EditorState,
    procedure: Procedure
  ): Procedure[] {
    let anonymousProcedures: Procedure[] = [];
    node.cursor().iterate((noderef) => {
      if (noderef.node.to > node.to) {
        return false;
      }
      if (
        node != noderef.node &&
        (noderef.name == 'AnonymousProcedure' ||
          noderef.name == 'ShortAnonymousProcedure') &&
        !this.checkRanges(anonymousProcedures, noderef.node)
      ) {
        anonymousProcedures.push(
          this.getAnonProcedure(noderef, State, procedure)
        );
      }
    });
    return anonymousProcedures;
  }

  private checkRanges(
    procedures: Procedure[] | CodeBlock[],
    node: SyntaxNode
  ): boolean {
    let included = false;
    for (let p of procedures) {
      if (p.PositionStart <= node.from && p.PositionEnd >= node.to) {
        included = true;
      }
    }
    return included;
  }

  private getAnonProcedure(
    noderef: SyntaxNodeRef,
    State: EditorState,
    procedure: Procedure
  ): Procedure {
    let anonProc = new Procedure();
    anonProc.PositionStart = noderef.from;
    anonProc.PositionEnd = noderef.to;
    anonProc.Variables = procedure.Variables;
    anonProc.IsAnonymous = true;
    anonProc.Name = '';
    anonProc.IsCommand =
      noderef.node.getChildren('ProcedureContent').length > 0;
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
    anonProc.Variables = anonProc.Variables.concat(
      this.getLocalVars(Node, State, true)
    );

    anonProc.AnonymousProcedures = this.searchAnonProcedure(
      Node,
      State,
      anonProc
    );
    return anonProc;
  }

  // getText: Get the text of a node.
  private getText(State: EditorState, Node: SyntaxNode): string {
    return State.sliceDoc(Node.from, Node.to).toLowerCase();
  }

  // get local variables for the procedure
  private getLocalVars(
    Node: SyntaxNode,
    State: EditorState,
    isAnon: Boolean
  ): LocalVariable[] {
    let localVars: LocalVariable[] = [];
    Node.getChildren('ProcedureContent').map((node1) => {
      node1.getChildren('CommandStatement').map((node2) => {
        node2.getChildren('VariableDeclaration').map((node3) => {
          node3.getChildren('NewVariableDeclaration').map((node4) => {
            node4.getChildren('Identifier').map((node5) => {
              let variable = new LocalVariable(
                this.getText(State, node5),
                1,
                node5.from
              );
              localVars.push(variable);
            });
          });
        });
      });
    });
    // let parentVars = this.getParentVars(Node,State)
    // localVars=localVars.concat(parentVars.vars)

    // Node.cursor().iterate((noderef) => {
    //   if (noderef.node.to > Node.to) {
    //     return false;
    //   }
    //   if (noderef.name == 'CommandStatement') {
    //     noderef.node.getChildren('VariableDeclaration').map((node) => {
    //       node.getChildren('NewVariableDeclaration').map((subnode) => {
    //         subnode.getChildren('Identifier').map((subsubnode) => {
    //           if (
    //             !this.getParents(subsubnode).includes('AnonymousProcedure') ||
    //             !this.getParents(subsubnode).includes('ShortAnonymousProcedure') ||
    //             !this.getParents(subsubnode).includes('CodeBlock') ||
    //             isAnon
    //           ) {
    //             const variable = new LocalVariable(
    //               this.getText(State, subsubnode),
    //               1,
    //               subsubnode.from
    //             );
    //             localVars.push(variable);
    //           }
    //         });
    //       });
    //     });
    //   }
    // });
    return localVars;
  }

  private getParentVars(Node: SyntaxNode, state: EditorState) {
    let from = Node.from;
    let to = Node.to;
    let vars: LocalVariable[] = [];
    let args: string[] = [];
    for (let p of this.Procedures.values()) {
      if (p.PositionStart <= from && p.PositionEnd >= to) {
        vars = vars.concat(p.Variables);
        args = args.concat(p.Arguments);
      }
      for (let a of p.AnonymousProcedures) {
        if (a.PositionStart <= from && a.PositionEnd >= to) {
          vars = vars.concat(a.Variables);
          args = args.concat(a.Arguments);
        }
      }
      for (let b of p.CodeBlocks) {
        if (b.PositionStart <= from && b.PositionEnd >= to) {
          vars = vars.concat(b.Variables);
        }
      }
    }
    vars = [...new Set(vars)];
    args = [...new Set(args)];
    return { vars: vars, args: args };
  }

  private getParents(Node: SyntaxNode): string[] {
    let parents: string[] = [];
    let curr = Node;
    while (curr.parent) {
      parents.push(curr.parent.name);
      curr = curr.parent;
    }
    return parents;
  }

  private getVariables(Node: SyntaxNode, State: EditorState): string[] {
    let vars: string[] = [];
    Node.cursor().iterate((noderef) => {
      if (noderef.node.to > Node.to) {
        return false;
      }
      if (
        ['Identifier', 'BreedFirst', 'BreedMiddle', 'BreedLast'].includes(
          noderef.name
        )
      ) {
        vars.push(this.getText(State, noderef.node));
      }
    });
    return vars;
  }

  // get arguments for the procedure
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
  create: (State) => new StateNetLogo().ParseState(State),
  update: (Original: StateNetLogo, Transaction: Transaction) => {
    if (Transaction.docChanged) {
      console.log(Original);
      console.log(Transaction.changes);
      Original.SetDirty();
    }
    return Original;
  },
});

export { stateExtension };
