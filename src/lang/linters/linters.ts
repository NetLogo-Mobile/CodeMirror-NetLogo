import { IdentifierLinter } from './identifier-linter';
import { UnrecognizedGlobalLinter } from './unrecognized-global-linter';
import { BreedLinter } from './breed-linter';

export const netlogoLinters = [
  UnrecognizedGlobalLinter,
  IdentifierLinter,
  BreedLinter,
];
