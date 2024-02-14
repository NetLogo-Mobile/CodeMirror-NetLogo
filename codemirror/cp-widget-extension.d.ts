import { WidgetType, EditorView, DecorationSet, ViewPlugin, ViewUpdate } from '@codemirror/view';
/** ColorPickerWidget: Defines a ColorPicker widget of WidgetType */
declare class ColorPickerWidget extends WidgetType {
    private color;
    private length;
    /** colorType: the representation of the color:
     * 'compound' --> netlogo compound color ( red + 5 )
     * 'numeric' --> netlogo color numeric value: ( 45 )
     * 'array' --> rgba or rgb values : [25 13 12], [25 89 97 24]
     */
    private colorType;
    constructor(color: string, length: number, type: string);
    getColor(): string;
    getLength(): number;
    getColorType(): string;
    /** toDOM: defines the DOM appearance of the widget. Not connected to the widget as per CodeMirror documentation */
    toDOM(): HTMLSpanElement;
    ignoreEvent(): boolean;
}
/** ColorPickerPlugin: Main driver of the plugin. Creates a ColorPicker instance when a widget is pressed. Maintains a mapping of widgets to their position */
declare const ColorPickerPlugin: ViewPlugin<{
    decorations: DecorationSet;
    posToWidget: Map<number, ColorPickerWidget>;
    update(update: ViewUpdate): void;
    handleMouseDown(e: MouseEvent, view: EditorView): void;
}>;
export { ColorPickerPlugin };
//# sourceMappingURL=cp-widget-extension.d.ts.map