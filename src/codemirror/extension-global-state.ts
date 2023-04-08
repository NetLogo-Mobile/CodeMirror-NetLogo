import { StateField, Transaction, EditorState } from '@codemirror/state';
import { PreprocessContext, LintContext } from '../lang/classes';

export class GlobalState {
  public PreprocessContext: PreprocessContext = new PreprocessContext();
  public LintContext: LintContext = new LintContext();
  public SetPreprocessContext(
    PreprocessContext: PreprocessContext,
    verbose: boolean = false
  ) {
    //console.log("SETTING before",PreprocessContext)
    this.PreprocessContext = PreprocessContext;
    if (verbose) {
      console.log('SETTING', this.PreprocessContext);
    }
  }
  public SetLintContext(LintContext: LintContext, verbose: boolean = false) {
    //console.log("SETTING before",LintContext)
    this.LintContext = LintContext;
    if (verbose) {
      console.log('SETTING', this.LintContext);
    }
  }
  public GetPreprocessContext(verbose: boolean = false) {
    if (verbose) {
      console.log(this.PreprocessContext);
    }
    return this.PreprocessContext;
  }
  public GetLintContext(verbose: boolean = false) {
    if (verbose) {
      console.log(this.LintContext);
    }
    return this.LintContext;
  }
}

/** GlobalStateExtension: Extension for managing the editor state.  */
const globalStateExtension = StateField.define<GlobalState>({
  create: (State) => new GlobalState(),
  update: (Original: GlobalState, Transaction: Transaction) => {
    if (!Transaction.docChanged) return Original;
    //Original.ParseState(Transaction.state);
    //   console.log("HERERERERERERERE",Original,Transaction.state.field(globalStateExtension));
    return Original;
  },
});

export { globalStateExtension };
