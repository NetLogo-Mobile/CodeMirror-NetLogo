import { ExternalTokenizer } from "@lezer/lr"
import { directives, commands, extensions, reporters, turtleVars, patchVars, linkVars, constants, unsupported } from "./keywords.js"
import { Directive, Command, Extension, Reporter, TurtleVar, PatchVar, LinkVar, Constant, Unsupported, Identifier } from "./lang.terms.js"

// Keyword tokenizer
export const keyword = new ExternalTokenizer(input => {
    let token = "";
    // Find until the token is complete
    while (isValidKeyword(input.next)) {
        token += String.fromCharCode(input.next).toLowerCase();
        input.advance();
    }
    if (token == "") return;
    // Find if the token belongs to any category
    if (directives.indexOf(token) != -1) {
        input.acceptToken(Directive);
    } else if (commands.indexOf(token) != -1) {
        input.acceptToken(Command);
    } else if (extensions.indexOf(token) != -1) {
        input.acceptToken(Extension);
    } else if (reporters.indexOf(token) != -1) {
        input.acceptToken(Reporter);
    } else if (turtleVars.indexOf(token) != -1) {
        input.acceptToken(TurtleVar)
    } else if (patchVars.indexOf(token) != -1) {
        input.acceptToken(PatchVar);
    } else if (linkVars.indexOf(token) != -1) {
        input.acceptToken(LinkVar);
    } else if (constants.indexOf(token) != -1) {
        input.acceptToken(Constant);
    } else if (unsupported.indexOf(token) != -1) {
        input.acceptToken(Unsupported);
    } else {
        input.acceptToken(Identifier);
    }
});

// Check if the character is valid for a keyword. 
function isValidKeyword(ch) {
    // 0-9
    return ch >= 48 && ch <= 58 
    // -
    || ch == 45 
    // _
    || ch == 95 
    // A-Z
    || ch >= 63 && ch <= 90 
    // a-z
    || ch >= 97 && ch <= 122 
    // non-English characters
    || ch>=128 && ch <=154 
    || ch>= 160 && ch<= 165 
    || ch>=181 && ch <=183 
    || ch>=210 && ch<=216 
    || ch>=224 && ch<=237
}