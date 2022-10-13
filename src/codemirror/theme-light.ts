import { EditorView } from "@codemirror/view"

let lightTheme = EditorView.theme({
    "&": {
        "height": "100%"
    }
});

export { lightTheme };