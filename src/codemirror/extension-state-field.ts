import { StateField } from "@codemirror/state"

const extensionState = StateField.define<Object>({
    create: (State) => new Object(),
    update: (Original, Transaction) => Original
})

export { extensionState }; 