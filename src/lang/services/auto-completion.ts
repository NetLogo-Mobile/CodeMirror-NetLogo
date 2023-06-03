import { directives, turtleVars, patchVars, linkVars, constants } from '../keywords';
import { Completion, CompletionSource, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';
import { PrimitiveManager } from '../primitives/primitives';
import { getLocalVars } from '../linters/utils/check-identifier';
import { GalapagosEditor } from '../../editor';
import { BreedType } from '../classes/structures';
import { ParseMode } from '../../editor-config';
import { Log } from '../../codemirror/utils/debug-utils';
import { LintContext } from '../classes/contexts';

/** AutoCompletion: Auto completion service for a NetLogo model. */
/* Possible Types of Autocompletion Tokens:
Directive; Constant; Extension; 
Variable-Builtin; Variable-Global; Variable-Breed;
Breed;
Command; Command-Custom; Reporter; Reporter-Custom.
*/
export class AutoCompletion {
  /** Editor: The editor instance. */
  private Editor: GalapagosEditor;
  /** Constructor: Create a new auto completion service. */
  constructor(Editor: GalapagosEditor) {
    this.Editor = Editor;
  }

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
  private KeywordsToCompletions(Keywords: string[], Type: string): Completion[] {
    return Keywords.map(function (x) {
      return { label: x, type: Type };
    });
  }

  /** ParentMaps: Maps of keywords to parents.  */
  private ParentMaps: Record<string, Completion[]> = {
    Extensions: this.KeywordsToCompletions(PrimitiveManager.GetExtensions(), 'Extension'), // Extensions
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
  private GetParentKeywords(Type: string, State: LintContext): Completion[] {
    // console.log(Type);
    let results = this.ParentMaps[Type];
    switch (Type) {
      case 'Extensions':
        results = results.filter((ext) => !State.Extensions.has(ext.label));
        break;
      case 'VariableName':
        results = results.concat(
          this.KeywordsToCompletions([...State.Globals.keys(), ...State.WidgetGlobals.keys()], 'Variable')
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

  /** getBreedCommands: Get breed commands. */
  private getBreedCommands(state: LintContext): string[] {
    let commands: string[] = [];
    for (let b of state.Breeds.values()) {
      // Patch has no commands
      if (b.BreedType == BreedType.Patch) continue;
      if (b.BreedType == BreedType.Turtle) {
        commands.push('hatch-' + b.Plural);
        commands.push('sprout-' + b.Plural);
        commands.push('create-' + b.Plural);
        commands.push('create-ordered-' + b.Plural);
      } else {
        commands.push('create-' + b.Plural + '-to');
        commands.push('create-' + b.Singular + '-to');
        commands.push('create-' + b.Plural + '-from');
        commands.push('create-' + b.Singular + '-from');
        commands.push('create-' + b.Plural + '-with');
        commands.push('create-' + b.Singular + '-with');
      }
    }
    return commands;
  }

  /** getBreedReporters: Get breed reporters. */
  private getBreedReporters(state: LintContext): string[] {
    let reporters: string[] = [];
    for (let b of state.Breeds.values()) {
      if (b.BreedType == BreedType.Turtle || b.BreedType == BreedType.Patch) {
        reporters.push(b.Plural + '-at');
        reporters.push(b.Plural + '-here');
        reporters.push(b.Plural + '-on');
        reporters.push('is-' + b.Singular + '?');
      } else {
        reporters.push('out-' + b.Singular + '-to');
        reporters.push('out-' + b.Singular + '-neighbors');
        reporters.push('out-' + b.Singular + '-neighbor?');
        reporters.push('in-' + b.Singular + '-from');
        reporters.push('in-' + b.Singular + '-neighbors');
        reporters.push('in-' + b.Singular + '-neighbor?');
        reporters.push('my-' + b.Plural);
        reporters.push('my-in-' + b.Plural);
        reporters.push('my-out-' + b.Plural);
        reporters.push(b.Singular + '-neighbor?');
        reporters.push(b.Singular + '-neighbors');
        reporters.push(b.Singular + '-with');
        reporters.push('is-' + b.Singular + '?');
      }
    }
    return reporters;
  }

  /** GetCompletion: Get the completion hint at a given context. */
  public GetCompletion(Context: CompletionContext): CompletionResult | null | Promise<CompletionResult | null> {
    // Preparation
    const node = syntaxTree(Context.state).resolveInner(Context.pos, -1);
    const from = /\./.test(node.name) ? node.to : node.from;
    const nodeName = node.type.name;
    let parentName = node.parent?.type.name ?? '';
    const grandparentName = node.parent?.parent?.type.name ?? '';
    const context = this.Editor.LintContext;
    //console.log(nodeName,parentName,grandparentName)

    // Debug output
    let curr = node;
    let parents = [];
    while (curr.parent) {
      parents.push(curr.parent.name);
      curr = curr.parent;
    }
    Log(node.name + '/' + parents.join('/'));

    if (
      (parents.includes('OnelineReporter') && this.Editor.Options.ParseMode == ParseMode.Normal) ||
      (grandparentName == 'Normal' && parentName == '⚠')
    ) {
      parentName = 'Program';
    }

    // If the parent/grand parent node is of a type specified in this.maps
    if (this.ParentTypes.indexOf(parentName) > -1)
      return { from, options: this.GetParentKeywords(parentName, context) };
    if (this.ParentTypes.indexOf(grandparentName) > -1 && (parentName != 'Procedure' || nodeName == 'To'))
      return {
        from,
        options: this.GetParentKeywords(grandparentName, context),
      };

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
      const extensions = [...context.Extensions.keys()];
      const extensionNames = extensions.join(',');
      if (this.LastExtensions != extensionNames) {
        this.LastPrimitives = PrimitiveManager.GetCompletions(extensions);
        this.LastExtensions = extensionNames;
      }
      results = results.concat(this.LastPrimitives);
      // Breeds
      if (context.Breeds.size > 0) {
        let breeds = context.GetBreedNames();
        breeds = breeds.filter((breed) => !['turtle', 'turtles', 'patch', 'patches', 'link', 'links'].includes(breed));
        results.push(...this.KeywordsToCompletions(breeds, 'Breed'));
        results.push(...this.KeywordsToCompletions(this.getBreedCommands(context), 'Command'));
        results.push(...this.KeywordsToCompletions(this.getBreedReporters(context), 'Reporter'));
        results.push(...this.KeywordsToCompletions(context.GetBreedVariables(), 'Variable-Breed'));
      }
      // Global Variables
      results.push(
        ...this.KeywordsToCompletions([...context.Globals.keys(), ...context.WidgetGlobals.keys()], 'Variable-Global')
      );
      // Custom Procedures
      for (var Procedure of context.Procedures.values()) {
        results.push({
          label: Procedure.Name,
          type: Procedure.IsCommand ? 'Command-Custom' : 'Reporter-Custom',
        });
      }
      // Valid local variables
      results.push(...this.KeywordsToCompletions(getLocalVars(node, Context.state, context), 'Variable-Local'));
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
