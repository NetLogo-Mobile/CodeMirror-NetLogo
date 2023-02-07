import {
  directives,
  turtleVars,
  patchVars,
  linkVars,
  constants,
} from './keywords';
import {
  stateExtension,
  StateNetLogo,
} from '../codemirror/extension-state-netlogo';
import {
  Completion,
  CompletionSource,
  CompletionContext,
  CompletionResult,
} from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';
import { PrimitiveManager } from './primitives/primitives';
import { getLocalVars } from './linters/identifier-linter';

/** AutoCompletion: Auto completion service for a NetLogo model. */
/* Possible Types of Autocompletion Tokens:
Directive; Constant; Extension; 
Variable-Builtin; Variable-Global; Variable-Breed;
Breed;
Command; Command-Custom; Reporter; Reporter-Custom.
*/
export class AutoCompletion {
  /** BuiltinVariables: The completion list of built-in variables. */
  private BuiltinVariables: Completion[] = this.KeywordsToCompletions(
    [...turtleVars, ...patchVars, ...linkVars],
    'Variable-Builtin'
  );
  /** SharedIdentifiers: Shared built-in completions. */
  private SharedIdentifiers: Completion[] = [
    { label: 'end', type: 'Directive' },
    ...this.BuiltinVariables,
    ...this.KeywordsToCompletions(constants, 'Constant'),
  ];
  /** LastExtensions: Cached extension list. */
  private LastExtensions: string = '$NIL$';
  /** LastPrimitives: Cached primitive list. */
  private LastPrimitives: Completion[] = [];

  /** KeywordsToCompletions: Transform keywords to completions. */
  private KeywordsToCompletions(
    Keywords: string[],
    Type: string
  ): Completion[] {
    return Keywords.map(function (x) {
      return { label: x, type: Type };
    });
  }

  /** ParentMaps: Maps of keywords to parents.  */
  private ParentMaps: Record<string, Completion[]> = {
    Extensions: this.KeywordsToCompletions(
      PrimitiveManager.GetExtensions(),
      'Extension'
    ), // Extensions
    Program: this.KeywordsToCompletions(directives, 'Directive'), // Directives
    Globals: [], // Names of global variables
    BreedsOwn: [], // Names of breed variables
    Breed: [], // Names of breeds
    ProcedureName: [], // Names of procedures
    Arguments: [], // Arguments of procedures
    /* VariableName: this.KeywordsToCompletions(
      [...turtleVars, ...patchVars, ...linkVars],
      'Variable-Builtin'
    ), // Built-in variable names*/
    // Temporary fix
  };
  /** ParentTypes: Types of keywords.  */
  private ParentTypes = Object.keys(this.ParentMaps);

  /** GetParentKeywords: Get keywords of a certain type. */
  private GetParentKeywords(Type: string, State: StateNetLogo): Completion[] {
    let results = this.ParentMaps[Type];
    switch (Type) {
      case 'Extensions':
        results = results.filter(
          (ext) => !State.Extensions.includes(ext.label)
        );
        break;
      case 'VariableName':
        results = results.concat(
          this.KeywordsToCompletions(State.Globals, 'Variable')
        );
        break;
      case 'Program':
        results = results.concat(
          this.KeywordsToCompletions(
            [...State.Breeds.values()].map((breed) => breed.Plural + '-own'),
            'Directive'
          )
        );
        break;
    }
    return results;
  }

  /** GetCompletion: Get the completion hint at a given context. */
  public GetCompletion(
    Context: CompletionContext
  ): CompletionResult | null | Promise<CompletionResult | null> {
    // Preparation
    const node = syntaxTree(Context.state).resolveInner(Context.pos, -1);
    const from = /\./.test(node.name) ? node.to : node.from;
    const nodeName = node.type.name;
    const parentName = node.parent?.type.name ?? '';
    const grandparentName = node.parent?.parent?.type.name ?? '';
    const state = Context.state.field(stateExtension);

    // Debug output
    let curr = node;
    let parents = [];
    while (curr.parent) {
      parents.push(curr.parent.name);
      curr = curr.parent;
    }
    console.log(node.name + '/' + parents.join('/'));

    // If the parent/grand parent node is of a type specified in this.maps
    if (this.ParentTypes.indexOf(parentName) > -1)
      return { from, options: this.GetParentKeywords(parentName, state) };
    if (
      this.ParentTypes.indexOf(grandparentName) > -1 &&
      (parentName != 'Procedure' || nodeName == 'To')
    )
      return { from, options: this.GetParentKeywords(grandparentName, state) };

    // Otherwise, try to build a full list
    if (
      (nodeName == 'Identifier' ||
        nodeName == 'Extension' ||
        nodeName.includes('Reporter') ||
        nodeName.includes('Command') ||
        nodeName == 'Set' ||
        nodeName == 'Let') &&
      parentName != 'Unrecognized'
    ) {
      let results = this.SharedIdentifiers;
      // Extensions
      const extensionNames = state.Extensions.join(',');
      if (this.LastExtensions != extensionNames) {
        this.LastPrimitives = PrimitiveManager.GetCompletions(state.Extensions);
        this.LastExtensions = extensionNames;
      }
      results = results.concat(this.LastPrimitives);
      // Breeds
      if (state.Breeds.size > 0) {
        let breeds = state.GetBreedNames();
        breeds = breeds.filter(
          (breed) =>
            ![
              'turtle',
              'turtles',
              'patch',
              'patches',
              'link',
              'links',
            ].includes(breed)
        );
        results.push(...this.KeywordsToCompletions(breeds, 'Breed'));
        results.push(
          ...this.KeywordsToCompletions(
            state.GetBreedVariables(),
            'Variable-Breed'
          )
        );
      }
      // Global Variables
      results.push(
        ...this.KeywordsToCompletions(state.Globals, 'Variable-Global')
      );
      results.push(
        ...this.KeywordsToCompletions(state.WidgetGlobals, 'Variable-Global')
      );
      // Custom Procedures
      for (var Procedure of state.Procedures.values()) {
        results.push({
          label: Procedure.Name,
          type: Procedure.IsCommand ? 'Command-Custom' : 'Reporter-Custom',
        });
      }
      // Valid local variables
      results.push(
        ...this.KeywordsToCompletions(
          getLocalVars(node, Context.state, state),
          'Variable-Local'
        )
      );
      return { from, options: results };
    }

    // Failed
    return null;
  }

  /** GetCompletionSource: Get the completion source for a NetLogo model. */
  public GetCompletionSource(): CompletionSource {
    return (Context) => this.GetCompletion(Context);
  }
}
