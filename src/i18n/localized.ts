import { en_us } from './en_us';
import { zh_cn } from './zh_cn';

/** LocalizationManager: Manage all localized texts. */
class LocalizationManager {
  private Current: Record<string, Function> = en_us;
  /** Get: Get a localized key. */
  public Get(Key: string, ...Args: string[]) {
    var Bundle = this.Current;
    if (!Bundle.hasOwnProperty(Key)) Bundle = en_us;
    if (!Bundle.hasOwnProperty(Key)) return `Unknown message: ${Key}`;
    try {
      return Bundle[Key].apply(this, Args);
    } catch {
      return `Error in producing message: ${Key}`;
    }
  }
  /** Switch: Switch to another language. */
  public Switch(Locale: string) {
    switch (Locale.toLowerCase()) {
      case 'zh_cn':
      case 'chinese':
        this.Current = zh_cn;
        break;
      default:
        this.Current = en_us;
        break;
    }
  }
}

/** Singleton */
const Localized = new LocalizationManager();
export { Localized };

/** Global singleton */
try {
  (window as any).EditorLocalized = Localized;
} catch (error) {}
