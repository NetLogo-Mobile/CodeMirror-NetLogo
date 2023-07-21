import { EditorView, WidgetType } from '@codemirror/view';
export declare class textWidget extends WidgetType {
    widgetText: string;
    textColor: string;
    fontWeight: string;
    textDecoration: string;
    decoThickness: string;
    bgColor: string;
    constructor(text: string, color?: string, decoration?: string, decoThickness?: string, bgColor?: string, fontWeight?: string);
    toDOM(): HTMLSpanElement;
}
export declare class CheckboxWidget extends WidgetType {
    private readonly CodeMirror;
    private readonly CurrentVersion;
    constructor(editor: EditorView, finalText: string);
    toDOM(): HTMLSpanElement;
    ignoreEvent(): boolean;
}
//# sourceMappingURL=highlightWidgets.d.ts.map