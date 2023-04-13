import { StateField, Transaction, EditorState } from '@codemirror/state';
import { PreprocessContext } from '../lang/classes';
import { GalapagosEditor, Localized } from '../editor';

/** StatePreprocess: The first-pass state for the NetLogo Language. */
export class StatePreprocess {
  /** PluralBreeds: Breeds in the model. */
  public PluralBreeds: string[] = [];
  /** SingularBreeds: Breeds in the model. */
  public SingularBreeds: string[] = [];
  /** BreedVars: Breed variables in the model. */
  public BreedVars: string[] = [];
  /** Commands: Commands in the model. */
  public Commands: Map<string, number> = new Map<string, number>();
  /** Reporters: Reporters in the model. */
  public Reporters: Map<string, number> = new Map<string, number>();
  /** Context: The shared preprocess context. */
  public Context: PreprocessContext | null = null;
  /** Editor: The editor for the state. */
  public Editor: GalapagosEditor | null = null;
  /** ParseState: Parse the state from an editor state. */
  public ParseState(State: EditorState): StatePreprocess {
    this.PluralBreeds = [];
    this.SingularBreeds = [];
    this.Commands.clear();
    this.Reporters.clear();
    let doc = State.doc.toString();
    // Breeds
    let breeds = doc.matchAll(/breed\s*\[\s*([^\s]+)\s+([^\s]+)\s*\]/g);
    let processedBreeds = this.processBreeds(breeds);
    this.SingularBreeds = processedBreeds[0];
    this.PluralBreeds = processedBreeds[1];
    let breedVars = doc.matchAll(/[^\s]+-own\s*\[([^\]]+)/g);
    this.BreedVars = this.processBreedVars(breedVars);
    // Commands
    let commands = doc.matchAll(/(^|\n)\s*to\s+([^\s\[]+)(\s*\[([^\]]*)\])?/g);
    this.Commands = this.processProcedures(commands);
    // Reporters
    let reporters = doc.matchAll(
      /(^|\n)\s*to-report\s+([^\s\[]+)(\s*\[([^\]]*)\])?/g
    );
    this.Reporters = this.processProcedures(reporters);
    return this;
  }

  /** SetEditor: Set the editor for the state. */
  public SetEditor(editor: GalapagosEditor) {
    this.Editor = editor;
  }

  /** processBreedVars: Parse the code for breed variables. */
  private processBreedVars(
    matches: IterableIterator<RegExpMatchArray>
  ): string[] {
    let vars: string[] = [];
    for (var m of matches) {
      let match = m[1];
      match = match.replace(/;[^\n]*\n/g, '');
      match = match.replace(/\n/g, ' ');
      match = match.toLowerCase();
      vars = vars.concat(match.split(' ').filter((v) => v != '' && v != '\n'));
    }
    return vars;
  }

  /** processProcedures: Parse the code for procedure names. */
  private processProcedures(
    procedures: IterableIterator<RegExpMatchArray>
  ): Map<string, number> {
    let matches: Map<string, number> = new Map<string, number>();
    for (var match of procedures) {
      const name = match[2].toLowerCase();
      const args = match[4];
      matches.set(
        name,
        args == null ? 0 : [...args.matchAll(/([^\s])+/g)].length
      );
    }
    return matches;
  }

  /** processBreeds: Parse the code for breed names. */
  private processBreeds(
    breeds: IterableIterator<RegExpMatchArray>
  ): string[][] {
    let singularmatches: string[] = ['patch', 'turtle', 'link'];
    let pluralmatches: string[] = ['patches', 'turtles', 'links'];
    let count = 3;
    for (var match of breeds) {
      pluralmatches[count] = match[1];
      singularmatches[count] = match[2];
      count++;
    }
    return [singularmatches, pluralmatches];
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
    console.log(Original);
    return Original;
  },
});

export { preprocessStateExtension };
