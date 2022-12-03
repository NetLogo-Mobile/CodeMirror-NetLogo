const en_us: Record<string, Function> = {
  'Unrecognized breed name _': (Name: string) =>
    `The breed name "${Name}" cannot be recognized. Did you define it?`,
  'Unrecognized identifier _': (Name: string) =>
    `Nothing called "${Name}" was found. Did you spell it correctly?`,
  'Unrecognized global statement _': (Name: string) =>
    `"${Name}" cannot be recognized as a global-level statement. Did you spell it correctly?`,
  'Unrecognized statement _': (Name: string) =>
    `"${Name}" cannot be recognized as a piece of NetLogo code. Did you put it in the correct place?`,
};

export { en_us };
