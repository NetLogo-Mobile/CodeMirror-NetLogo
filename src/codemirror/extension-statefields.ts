import {StateField} from "@codemirror/state"

const extensionState = StateField.define<object>({
    create: (state) => {feature: false;},

})

export { extensionState };