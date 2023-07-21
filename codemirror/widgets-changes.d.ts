import { EditorView, WidgetType } from '@codemirror/view';
export declare class TextWidget extends WidgetType {
    private text;
    private className;
    constructor(text: string, className?: string);
    toDOM(): HTMLSpanElement;
}
export declare class CheckboxWidget extends WidgetType {
    private readonly CodeMirror;
    private readonly CurrentVersion;
    constructor(editor: EditorView, finalText: string);
    toDOM(): HTMLSpanElement;
    ignoreEvent(): boolean;
}
//# sourceMappingURL=widgets-changes.d.ts.map