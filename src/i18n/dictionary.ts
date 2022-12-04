import { Localized } from './localized';

/** DictionaryManager: Dictionary support. */
class DictionaryManager {
  /** Data: Data of the dictionary. */
  private Data: Record<string, string> = {};
  // Initialize: Initialize the manager with given data.
  public Initialize(Data: Record<string, string>) {
    this.Data = Data;
    // Built-in types
    this.RegisterBuiltin('~VariableName');
    this.RegisterBuiltin('~ProcedureName');
    this.RegisterBuiltin('~Arguments/Identifier');
    this.RegisterBuiltin('~PatchVar');
    this.RegisterBuiltin('~TurtleVar');
    this.RegisterBuiltin('~LinkVar');
    this.RegisterBuiltin('~Reporter');
    this.RegisterBuiltin('~Command');
    this.RegisterBuiltin('~Constant');
    this.RegisterBuiltin('~Extension');
    this.RegisterBuiltin('~String');
    this.RegisterBuiltin('~LineComment');
    this.RegisterBuiltin('~Globals/Identifier');
    this.RegisterBuiltin('~BreedVars/Identifier');
    this.RegisterBuiltin('~BreedPlural');
    this.RegisterBuiltin('~BreedSingular');
  }
  // RegisterInternal: Register some built-in explanations.
  private RegisterBuiltin(...Args: string[]) {
    Args.map(
      (Arg) => (this.Data[Arg.toLowerCase()] = Localized.Get(Args[0], '{0}'))
    );
  }
  // Get: Get an explanation from the dictionary.
  public Get(Key: string, Value: string): string {
    if (Dictionary.Check(Key))
      return Dictionary.Data[Key.trim().toLowerCase()].replace('{0}', Value);
    return Key;
  }
  // Check: Check if a key exists in the dictionary.
  public Check(Key: string): boolean {
    return this.Data && this.Data.hasOwnProperty(Key.trim().toLowerCase());
  }
  // ClickHandler: The click handler for clickable dictionary items.
  public ClickHandler?: (Key: string) => void;
}

/** Singleton */
const Dictionary = new DictionaryManager();
export { Dictionary };

/** Global singleton */
try {
  (window as any).EditorDictionary = Dictionary;
} catch (error) {}
