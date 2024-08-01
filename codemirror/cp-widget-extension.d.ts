import { WidgetType, EditorView, DecorationSet, ViewPlugin, ViewUpdate } from '@codemirror/view';
/** ColorPickerWidget: Defines a ColorPicker widget of WidgetType. This widget will appear in the cm-dom */
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
    ignoreEvent(event: Event): boolean;
}
/**
 * Creates and returns the main ColorPicker plugin for CodeMirror.
 * @param OnColorPickerCreate - Optional callback function to be called after color picker creation
 * @returns A ViewPlugin instance that can be added to the CodeMirror editor
 */
declare function createColorPickerPlugin(OnColorPickerCreate?: (cpDiv: HTMLElement) => void): ViewPlugin<{
    decorations: DecorationSet;
    posToWidget: Map<number, ColorPickerWidget>;
    update(update: ViewUpdate): void;
    /** setWidgetsZindex: Helper function to change the ZIndex briefly to make widget interactable */
    setWidgetsInteractability(view: EditorView, pointerValue: string): void;
}>;
export { createColorPickerPlugin };
//# sourceMappingURL=cp-widget-extension.d.ts.map