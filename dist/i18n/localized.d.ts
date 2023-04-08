/** LocalizationManager: Manage all localized texts. */
declare class LocalizationManager {
    private Current;
    /** Get: Get a localized key. */
    Get(Key: string, ...Args: string[]): any;
    /** Switch: Switch to another language. */
    Switch(Locale: string): void;
}
export { LocalizationManager };
