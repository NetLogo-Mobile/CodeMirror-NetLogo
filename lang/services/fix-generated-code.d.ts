import { GalapagosEditor } from '../../editor';
import { CodeSnapshot } from './code-snapshot';
/** FixGeneratedCode: Try to fix and prettify the generated code. */
export declare function FixGeneratedCodeRegex(Editor: GalapagosEditor, Source: string, Parent?: CodeSnapshot): string;
export declare function FixGeneratedCode(Editor: GalapagosEditor, Source: string, Parent?: CodeSnapshot, try_again?: boolean): Promise<string>;
//# sourceMappingURL=fix-generated-code.d.ts.map