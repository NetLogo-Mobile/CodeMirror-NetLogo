import { StateField, Transaction, EditorState } from '@codemirror/state';

/** StatePreprocess: Editor state for the NetLogo Language. */
export class StatePreprocess {
  /** Breeds: Breeds in the model. */
  public PluralBreeds: string[] = [];
  public SingularBreeds: string[] = [];
  /** Procedures: Procedures in the model. */
  public Commands: Record<string, number> = {};
  public Reporters: Record<string, number> = {};
  /** ParseState: Parse the state from an editor state. */
  public ParseState(State: EditorState): StatePreprocess {
    this.PluralBreeds = [];
    this.SingularBreeds = [];
    this.Commands = {};
    this.Reporters = {};
    let doc = State.doc.toString();
    // Breeds
    let breeds = doc.matchAll(/breed\s*\[\s*([^\s]+)\s+([^\s]+)\s*\]/g);
    let processedBreeds = this.processBreeds(breeds);
    this.SingularBreeds = processedBreeds[0];
    this.PluralBreeds = processedBreeds[1];
    // Commands
    let commands = doc.matchAll(/(^|\n)to\s+([^\s]+)(\s*\[([^\]]*)\])?/g);
    this.Commands = this.processProcedures(commands);
    // Reporters
    let reporters = doc.matchAll(
      /(^|\n)to-report\s+([^\s]+)(\s*\[([^\]]*)\])?/g
    );
    this.Reporters = this.processProcedures(reporters);
    return this;
  }

  private processProcedures(
    procedures: IterableIterator<RegExpMatchArray>
  ): Record<string, number> {
    let matches: Record<string, number> = {};
    for (var match of procedures) {
      const name = match[2];
      const args = match[4];
      matches[name] = args == null ? 0 : [...args.matchAll(/([^\s])+/g)].length;
    }
    return matches;
  }

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
  create: (State) => new StatePreprocess().ParseState(State),
  update: (Original: StatePreprocess, Transaction: Transaction) => {
    if (!Transaction.docChanged) return Original;
    Original.ParseState(Transaction.state);
    console.log(Original);
    return Original;
  },
});

export { preprocessStateExtension };
