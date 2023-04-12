import { Tooltip } from '@codemirror/view';
import { StateField } from '@codemirror/state';
import { GalapagosEditor } from '../editor';
/** TooltipExtension: Extension for displaying language-specific tooltips. */
export declare const buildToolTips: (Editor: GalapagosEditor) => StateField<readonly Tooltip[]>;
