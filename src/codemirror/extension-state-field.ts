import { StateField } from "@codemirror/state"

const updateFn = function(original,transaction){
    let updated=original
    if (transaction.changes.inserted.length>0){
        let text = transaction._state.doc.text
        let found=false
        for (const line of text){
            if (line.includes('extensions')){
                if (line.includes('array')){
                    updated.array=true
                    found=true
                }
            }
        }
        if (!found){
            updated.array=false
        }
        console.log(text,transaction,updated)

    }
    return updated
}
    


const extensionState = StateField.define<Object>({
    create: (State) => new Object(),
    update: updateFn
})




export { extensionState }; 