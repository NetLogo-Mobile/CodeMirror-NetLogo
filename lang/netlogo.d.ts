import { LRLanguage, LanguageSupport } from '@codemirror/language';
import { GalapagosEditor } from '../editor';
import { PreprocessContext } from './classes.js';
/** NetLogoLanguage: The NetLogo language. */
export declare const NetLogoLanguage: LRLanguage;
/** NetLogo: The NetLogo language support. */
export declare function NetLogo(Editor: GalapagosEditor): LanguageSupport;
/** GetContext: Get the preprocess context from the parsing context. */
export declare function GetContext(): PreprocessContext;
