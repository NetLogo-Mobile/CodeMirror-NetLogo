import { StateField } from '@codemirror/state';
import { PreprocessContext, LintContext } from '../lang/classes';
export declare class GlobalState {
    PreprocessContext: PreprocessContext;
    LintContext: LintContext;
    SetPreprocessContext(PreprocessContext: PreprocessContext, verbose?: boolean): void;
    SetLintContext(LintContext: LintContext, verbose?: boolean): void;
    GetPreprocessContext(verbose?: boolean): PreprocessContext;
    GetLintContext(verbose?: boolean): LintContext;
}
/** GlobalStateExtension: Extension for managing the editor state.  */
declare const globalStateExtension: StateField<GlobalState>;
export { globalStateExtension };
