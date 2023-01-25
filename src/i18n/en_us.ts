const en_us: Record<string, Function> = {
  'Unrecognized breed name _': (Name: string) =>
    `Cannot recognize the breed name "${Name}". Did you define it at the beginning?`,
  'Unrecognized identifier _': (Name: string) =>
    `Nothing called "${Name}" was found. Did you spell it correctly?`,
  'Unrecognized global statement _': (Name: string) =>
    `Cannot recognize "${Name}" as a proper global statement here. Did you spell it correctly?`,
  'Unrecognized statement _': (Name: string) =>
    `Cannot recognize "${Name}" as a piece of NetLogo code. Did you put it in the correct place?`,
  'Unsupported statement _': (Name: string) =>
    `"${Name}" is not supported in this version of NetLogo.`,
  'Problem identifying primitive _. Expected _, found _.': (
    Name: string,
    Expected: string,
    Actual: string
  ) => `"${Name}" is not a valid primitive. Expected ${Expected} but found ${Actual}.`,
  'Left args for _. Expected _, found _.': (
    Name: string,
    Expected: string,
    Actual: string
  ) =>
    `"${Name}" expects ${Expected} left argument(s). ${Actual} argument(s) found.`,
  'Too few right args for _. Expected _, found _.': (
    Name: string,
    Expected: string,
    Actual: string
  ) =>
    `"${Name}" expects at least ${Expected} right argument(s). ${Actual} argument(s) found.`,
  'Too many right args for _. Expected _, found _.': (
    Name: string,
    Expected: string,
    Actual: string
  ) =>
    `"${Name}" expects at most ${Expected} right argument(s). ${Actual} argument(s) found.`,

  '~VariableName': (Name: string) => `A variable. `,
  '~ProcedureName': (Name: string) => `The name of a procedure. `,
  '~Arguments/Identifier': (Name: string) => `The name of an argument. `,
  '~PatchVar': (Name: string) => `A built-in variable for every patch. `,
  '~TurtleVar': (Name: string) => `A built-in variable for every turtle. `,
  '~LinkVar': (Name: string) => `A built-in variable for every link. `,
  '~Reporter': (Name: string) => `A NetLogo reporter. `,
  '~Command': (Name: string) => `A NetLogo command. `,
  '~Constant': (Name: string) => `A NetLogo constant. `,
  '~Extension': (Name: string) => `A NetLogo extension. `,
  '~Numeric': (Name: string) => `A number. `,
  '~String': (Name: string) => `A string, which is a sequence of characters.`,
  '~LineComment': (Name: string) =>
    `Comments do nothing in the program, but could help others read the code.`,
  '~Globals/Identifier': (Name: string) => `A model-defined global variable.`,
  '~BreedVars/Identifier': (Name: string) =>
    `A model-defined variable for a breed.`,
  '~BreedPlural': (Name: string) => `The plural name of a model-defined breed.`,
  '~BreedSingular': (Name: string) =>
    `The singular name of a model-defined breed.`,
};

export { en_us };
