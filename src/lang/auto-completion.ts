import { directives, commands, extensions, reporters, turtleVars, patchVars, linkVars, constants, unsupported, extensionCommands, extensionReporters } from "./keywords"
import { stateExtension, StateNetLogo } from "../codemirror/extension-state-netlogo"
import { Completion, CompletionSource, CompletionContext, CompletionResult } from "@codemirror/autocomplete"
import { syntaxTree } from "@codemirror/language";

/** AutoCompletion: Auto completion service for a NetLogo model. */
export class AutoCompletion {
    /** allIdentifiers: All built-in identifiers. */
    private allIdentifiers = ["end", ...commands, ...reporters, ...turtleVars, ...patchVars, ...linkVars, ...constants];

    /** KeywordsToCompletions: Transform keywords to completions. */
    private KeywordsToCompletions(Keywords: string[], Type: string): Completion[] {
        return Keywords.map(function (x) {
            return { label: x, type: Type };
        });
    };

    /** ParentMaps: Maps of keywords to parents.  */
    private ParentMaps = {
        "Extensions": this.KeywordsToCompletions(extensions, "Extension"),
        "Program": this.KeywordsToCompletions(directives, "Extension"),
        "Globals": [], // Names of global variables
        "BreedsOwn": [], // Names of breed variables
        "Breed": [], // Names of breeds
        "ProcedureName": [], // Names of procedures
        "Arguments": [], // Arguments of procedures
        "VariableName":this.KeywordsToCompletions([...turtleVars, ...patchVars, ...linkVars],"Variables") //built-in variable names
    };

    /** ParentTypes: Types of keywords.  */
    private ParentTypes = Object.keys(this.ParentMaps);

    /** GetParentKeywords: Get keywords of a certain type. */
    private GetParentKeywords(Type: string, State: StateNetLogo): Completion[] {
        let results = this.ParentMaps[Type];
        switch (Type) {
            case "Extensions": 
                results = results.filter(ext => !State.Extensions.includes(ext.label));
                break;
            case "VariableName": 
                results = results.concat(this.KeywordsToCompletions(State.Globals,"Variables"));
                break;
        }
        return results;
    }

    /** GetCompletion: Get the completion hint at a given context. */
    public GetCompletion(Context: CompletionContext): CompletionResult | null | Promise<CompletionResult | null> {
        // Preparation
        let node = syntaxTree(Context.state).resolveInner(Context.pos, -1);
        let from = /\./.test(node.name) ? node.to : node.from;
        var parentName = node.parent?.type.name ?? "";
        var grandparentName = node.parent?.parent?.type.name ?? "";
        var nodeName = node.type.name;
        var state = Context.state.field(stateExtension);
        console.log(grandparentName + " / " + parentName + " / " + nodeName);
        // If the parent/grand parent node is of a type specified in this.maps
        if (this.ParentTypes.indexOf(parentName) > -1) {
            return {
                from,
                options: this.GetParentKeywords(parentName, state)
            };
        } else if (grandparentName != "Program" && this.ParentTypes.indexOf(grandparentName) > -1) {
            return {
                from,
                options: this.GetParentKeywords(grandparentName, state)
            };
        } else if (nodeName == 'Identifier') {
            let results = this.allIdentifiers;
            // Extensions
            let extensions = Context.state.field(stateExtension).Extensions;
            if (extensions.length > 0) {
                results = results.concat(this.FilterExtensions(extensionCommands.concat(extensionReporters), extensions));
            }
            // Breeds
            let breeds = Context.state.field(stateExtension).Breeds;
            if (breeds.length > 0) {
                for (let breed of breeds) {
                    results.push(breed.Plural + "-own")
                }
            }
            // Mappings
            return {
                from,
                options: this.KeywordsToCompletions(results, "Identifier")
            };
        } else return null;
    }

    /** GetCompletionSource: Get the completion source for a NetLogo model. */
    public GetCompletionSource(): CompletionSource {
        return (Context) => this.GetCompletion(Context);
    };

    /** FilterExtensions: Filter keywords for extensions. */
    private FilterExtensions(Keyword: string[], Extensions: string[]): string[] {
        Extensions = Extensions.map(Extension => Extension + ":");
        return Keyword.filter(Current => Extensions.findIndex(Extension => Current.startsWith(Extension)) != -1);
    }
}