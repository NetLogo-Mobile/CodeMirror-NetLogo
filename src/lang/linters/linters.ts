import { IdentifierLinter } from './identifier-linter';
import { UnrecognizedGlobalLinter } from './unrecognized-global-linter';
import { BreedLinter } from './breed-linter';
import { UnrecognizedLinter } from './unrecognized-linter';
import { CompilerLinter, RuntimeLinter } from './runtime-linter';

export const netlogoLinters = [
  CompilerLinter,
  RuntimeLinter,
  UnrecognizedLinter,
  UnrecognizedGlobalLinter,
  IdentifierLinter,
  BreedLinter,
];
