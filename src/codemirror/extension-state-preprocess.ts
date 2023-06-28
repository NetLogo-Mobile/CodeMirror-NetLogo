import { StateField, Transaction, EditorState } from '@codemirror/state';
import { GalapagosEditor, Localized } from '../editor';
import { Log } from '../utils/debug-utils';
import { BreedType } from '../lang/classes/structures';

/** StatePreprocess: The first-pass state for the NetLogo Language. */
export class StatePreprocess {
  /** PluralBreeds: Breeds in the model. */
  public PluralBreeds: string[] = [];
  /** SingularBreeds: Breeds in the model. */
  public SingularBreeds: string[] = [];
  /** SingularBreeds: Breed types in the model. */
  public BreedTypes: BreedType[] = [];
  /** BreedVars: Breed variables in the model. */
  public BreedVars: Map<string, string[]> = new Map<string, string[]>();
  /** Commands: Commands in the model. */
  public Commands: Map<string, number> = new Map<string, number>();
  /** Reporters: Reporters in the model. */
  public Reporters: Map<string, number> = new Map<string, number>();
  /** Editor: The editor for the state. */
  public Editor: GalapagosEditor | null = null;

  /** ParseState: Parse the state from an editor state. */
  public ParseState(State: EditorState): StatePreprocess {
    this.Commands.clear();
    this.Reporters.clear();
    this.BreedVars.clear();
    // Only leave the global variables
    let doc = State.doc.toString().toLowerCase();
    let globals = doc.replace(/(^|\n)([^;\n]+[ ]+)?to\s+[\s\S]*\s+end/gi, '');
    // Breeds
    let breeds = globals.matchAll(
      /(^|\n)([^;\n]+[ ]+)?(directed-link-|undirected-link-)?breed\s*\[\s*([^\s]+)\s+([^\s]+)\s*\]/g
    );
    this.processBreeds(breeds);
    // Breed variables
    let breedVars = globals.matchAll(/([^\s]+)-own\s*\[([^\]]+)/g);
    this.processBreedVars(breedVars);
    // Commands
    let commands = doc.matchAll(/(^|\n)([^;\n]+[ ]+)?to\s+([^\s\[;]+)(\s*\[([^\];]*)\])?/g);
    this.Commands = this.processProcedures(commands);
    // Reporters
    let reporters = doc.matchAll(/(^|\n)([^;\n]+[ ]+)?to-report\s+([^\s\[;]+)(\s*\[([^\]']*)\])?/g);
    this.Reporters = this.processProcedures(reporters);
    return this;
  }

  /** SetEditor: Set the editor for the state. */
  public SetEditor(Editor: GalapagosEditor) {
    this.Editor = Editor;
  }

  /** processBreedVars: Parse the code for breed variables. */
  private processBreedVars(matches: IterableIterator<RegExpMatchArray>) {
    for (var m of matches) {
      let variables = m[2];
      variables = variables.replace(/;[^\n]*\n/g, '');
      variables = variables.replace(/\n/g, ' ');
      this.BreedVars.set(
        m[1],
        variables.split(' ').filter((v) => v != '' && v != '\n')
      );
    }
  }

  /** processProcedures: Parse the code for procedure names. */
  private processProcedures(procedures: IterableIterator<RegExpMatchArray>): Map<string, number> {
    let matches: Map<string, number> = new Map<string, number>();
    for (var match of procedures) {
      if (!match[2] || match[2].split('"').length % 2 != 0) {
        const name = match[3];
        const args = match[5];
        matches.set(name, args == null ? 0 : [...args.matchAll(/([^\s])+/g)].length);
      }
    }
    return matches;
  }

  /** processBreeds: Parse the code for breed names. */
  private processBreeds(breeds: IterableIterator<RegExpMatchArray>) {
    this.SingularBreeds = ['patch', 'turtle', 'link'];
    this.PluralBreeds = ['patches', 'turtles', 'links'];
    this.BreedTypes = [BreedType.Patch, BreedType.Turtle, BreedType.UndirectedLink];
    for (var match of breeds) {
      var Type = BreedType.Turtle;
      if (match[3] == 'directed-link-') Type = BreedType.DirectedLink;
      if (match[3] == 'undirected-link-') Type = BreedType.UndirectedLink;
      this.BreedTypes.push(Type);
      this.PluralBreeds.push(match[4]);
      this.SingularBreeds.push(match[5]);
    }
  }
}

/** StateExtension: Extension for managing the editor state.  */
const preprocessStateExtension = StateField.define<StatePreprocess>({
  create: (State) => {
    let state = new StatePreprocess();
    state.ParseState(State);
    return state;
  },
  update: (Original: StatePreprocess, Transaction: Transaction) => {
    if (!Transaction.docChanged) return Original;
    Original.ParseState(Transaction.state);
    // Notify the editor
    if (Original.Editor) Original.Editor.UpdatePreprocessContext();
    Log(Original);
    return Original;
  },
});

export { preprocessStateExtension };
