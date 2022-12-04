const en_us: Record<string, Function> = {
  'Unrecognized breed name _': (Name: string) =>
    `Cannot recognize the breed name "${Name}". Did you define it at the beginning?`,
  'Unrecognized identifier _': (Name: string) =>
    `Nothing called "${Name}" was found. Did you spell it correctly?`,
  'Unrecognized global statement _': (Name: string) =>
    `Cannot recognize "${Name}" as a proper statement here. Did you spell it correctly?`,
  'Unrecognized statement _': (Name: string) =>
    `Cannot recognize "${Name}" as a piece of NetLogo code. Did you put it in the correct place?`,

  '~VariableName': (Name: string) => `"${Name}" is a variable. `,
  '~ProcedureName': (Name: string) => `"${Name}" is the name of a procedure. `,
  '~Arguments/Identifier': (Name: string) =>
    `"${Name}" is the name of an argument. `,
  '~PatchVar': (Name: string) =>
    `"${Name}" is a built-in variable for each patch. `,
  '~TurtleVar': (Name: string) =>
    `"${Name}" is a built-in variable for each turtle. `,
  '~LinkVar': (Name: string) =>
    `"${Name}" is a built-in variable for each link. `,
  '~Reporter': (Name: string) => `"${Name}" is a NetLogo reporter. `,
  '~Command': (Name: string) => `"${Name}" is a NetLogo command. `,
  '~Constant': (Name: string) => `"${Name}" is a NetLogo constant. `,
  '~Extension': (Name: string) => `"${Name}" is a NetLogo extension. `,
  '~Numeric': (Name: string) => `"${Name}" represents a number. `,
  '~String': (Name: string) => `Represents a sequence of characters.`,
  '~LineComment': (Name: string) =>
    `Comments do nothing in the program, but could help others read the code.`,
  '~Globals/Identifier': (Name: string) =>
    `"${Name}" is a model-defined global variable.`,
  '~BreedVars/Identifier': (Name: string) =>
    `"${Name}" is a model-defined variable for a breed.`,
  '~BreedPlural': (Name: string) =>
    `"${Name}" is the plural name of a model-defined breed.`,
  '~BreedSingular': (Name: string) =>
    `"${Name}" is the singular name of a model-defined breed.`,
};

export { en_us };
