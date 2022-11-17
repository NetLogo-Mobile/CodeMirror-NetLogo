import { StateField, Transaction, EditorState } from '@codemirror/state';

import { syntaxTree } from '@codemirror/language';
import {
  AnonymousProcedure,
  Breed,
  LocalVariable,
  Procedure,
} from '../lang/classes';
import { SyntaxNode } from '@lezer/common';

/** StateNetLogo: Editor state for the NetLogo Language. */
export class BasicState {
  /** Breeds: Breeds in the model. */
  public PluralBreeds: string[] = [];
  public SingularBreeds: string[] = [];
  /** Procedures: Procedures in the model. */
  public Commands: { [key: string]: number } = {};
  public Reporters: { [key: string]: number } = {};
  /** ParseState: Parse the state from an editor state. */
  public ParseState(State: EditorState): BasicState {
    // let iterator = State.doc.iterLines()
    this.PluralBreeds = [];
    this.SingularBreeds = [];
    this.Commands = {};
    this.Reporters = {};
    let doc = State.doc.toString();
    let breeds = doc.match(/breed\s*\[([A-Za-z0-9\-\_\s]*)\]/g);
    let commands = doc.match(
      /to\s+[A-Za-z0-9\-\_]+(\s*\[([A-Za-z0-9\-\_\s]*)\])?/g
    );
    let reporters = doc.match(
      /to-report\s+[A-Za-z0-9\-\_]+(\s*\[([A-Za-z0-9\-\_\s]*)\])?/g
    );
    if (breeds) {
      let processedBreeds = this.processBreeds(breeds);
      this.SingularBreeds = processedBreeds[0];
      this.PluralBreeds = processedBreeds[1];
    }
    if (commands) {
      this.Commands = this.processProcedures(commands);
    }
    if (reporters) {
      this.Reporters = this.processProcedures(reporters);
    }
    return this;
  }

  private processProcedures(arr: string[]): { [key: string]: number } {
    let matches: { [key: string]: number } = {};
    arr.map((item) => {
      item = item.replace('to-report', '').replace('to', '');
      let list = item.split('[');
      let argCount = 0;
      if (list.length == 2) {
        let args = list[1];
        args.replace(']', '');
        let arg_list = args.split(' ');
        for (let arg of arg_list) {
          if (arg != '') {
            argCount++;
          }
        }
      }
      item = list[0].trim();
      matches[item] = argCount;
    });
    return matches;
  }

  private processBreeds(arr: string[]): string[][] {
    let singularmatches: string[] = [];
    let pluralmatches: string[] = [];
    arr.map((item) => {
      item = item.replace('breed', '').replace('[', '').replace(']', '');
      let list = item.split(' ');
      let isFirst = true;
      for (let i of list) {
        if (i != '' && isFirst) {
          pluralmatches.push(i);
          isFirst = false;
        } else if (i != '') {
          singularmatches.push(i);
        }
      }
    });
    return [singularmatches, pluralmatches];
  }
}
/** StateExtension: Extension for managing the editor state.  */
const basicStateExtension = StateField.define<BasicState>({
  create: (State) => new BasicState().ParseState(State),
  update: (Original: BasicState, Transaction: Transaction) => {
    if (!Transaction.docChanged) return Original;
    Original.ParseState(Transaction.state);
    console.log(Original);
    return Original;
  },
});

export { basicStateExtension };
