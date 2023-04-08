import { IdentifierLinter } from './identifier-linter';
import { UnrecognizedGlobalLinter } from './unrecognized-global-linter';
import { BreedLinter } from './breed-linter';
import { UnrecognizedLinter } from './unrecognized-linter';
import { ArgumentLinter } from './argument-linter';
import { CompilerLinter, RuntimeLinter } from './runtime-linter';
import { UnsupportedLinter } from './unsupported-linter';
import { ExtensionLinter } from './extension-linter';
import { BreedNameLinter } from './breedname-linter';
import { BracketLinter } from './bracket-linter';
import { ModeLinter } from './mode-linter';
import { ContextLinter } from './context-linter';

export const netlogoLinters = [
  // CompilerLinter,
  // RuntimeLinter,
  // UnrecognizedLinter,
  // UnrecognizedGlobalLinter,
  IdentifierLinter,
  // BreedLinter,
  // ArgumentLinter,
  // UnsupportedLinter,
  // ExtensionLinter,
  // BreedNameLinter,
  // BracketLinter,
  // ModeLinter,
  // ContextLinter,
];
