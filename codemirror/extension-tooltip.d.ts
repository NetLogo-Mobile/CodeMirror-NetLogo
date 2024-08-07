import { GalapagosEditor } from '../editor';
/** buildToolTips: Extension for displaying language-specific & linting tooltips. */
export declare const buildToolTips: (Editor: GalapagosEditor) => import("@codemirror/state").Extension & {
    active: import("@codemirror/state").StateField<readonly import("@codemirror/view").Tooltip[]>;
};
//# sourceMappingURL=extension-tooltip.d.ts.map