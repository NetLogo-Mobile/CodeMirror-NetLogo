import { IdentifierLinter } from './identifier-linter';
import { UnrecognizedGlobalLinter } from './unrecognized-global-linter';
import { BreedLinter } from './breed-linter';
import { UnrecognizedLinter } from './unrecognized-linter';

export const netlogoLinters = [
  UnrecognizedLinter,
  UnrecognizedGlobalLinter,
  IdentifierLinter,
  BreedLinter,
];
