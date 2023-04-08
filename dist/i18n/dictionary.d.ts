/** DictionaryManager: Dictionary support. */
declare class DictionaryManager {
    /** Data: Data of the dictionary. */
    private Data;
    Initialize(Data: Record<string, string>): void;
    private RegisterBuiltin;
    Get(Key: string, Value: string): string;
    Check(Key: string): boolean;
    ClickHandler?: (Key: string) => void;
}
/** Singleton */
declare const Dictionary: DictionaryManager;
export { Dictionary };
