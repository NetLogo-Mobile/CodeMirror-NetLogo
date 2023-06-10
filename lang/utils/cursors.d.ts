import { EditorState } from '@codemirror/state';
import { TreeCursor } from '@lezer/common';
/** GetCursorUntilMode: Get the cursor until the "mode" node. */
export declare function GetCursorUntilMode(State: EditorState): TreeCursor | null;
/** GetCursorInsideMode: Get the cursor until inside the "node" part. */
export declare function GetCursorInsideMode(State: EditorState): TreeCursor | null;
//# sourceMappingURL=cursors.d.ts.map