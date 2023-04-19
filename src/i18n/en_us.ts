const en_us: Record<string, Function> = {
  // Buttons
  Add: () => 'Add',

  // Linting messages
  'Unrecognized breed name _': (Name: string) =>
    `Cannot recognize the breed name "${Name}". Did you define it at the beginning?`,
  'Unrecognized identifier _': (Name: string) =>
    `Nothing called "${Name}" was found. Did you spell it correctly?`,
  'Unrecognized global statement _': (Name: string) =>
    `Cannot recognize "${Name}" as a proper global statement here. Did you spell it correctly?`,
  'Unrecognized statement _': (Name: string) =>
    `Cannot recognize "${Name}" as a piece of NetLogo code. Did you put it in the correct place?`,
  'Unsupported statement _': (Name: string) =>
    `"${Name}" is not supported in this version of NetLogo, so linting may be incorrect.`,
  'Invalid for Normal mode _': (Value: string) =>
    `This editor mode expects a full NetLogo model.`,
  'Invalid for Embedded mode _': (Value: string) =>
    `This editor mode expects a few command statements.`,
  'Invalid for Oneline mode _': (Value: string) =>
    `This editor mode expects command statements or a single reporter statement.`,
  'Invalid for OnelineReporter mode _': (Value: string) =>
    `This editor mode expects a single reporter statement.`,
  'Problem identifying primitive _. Expected _, found _.': (
    Name: string,
    Expected: string,
    Actual: string
  ) =>
    `"${Name}" is not a valid primitive. Expected ${Expected} but found ${Actual}.`,
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
  'Missing extension _.': (Name: string) =>
    `Seems that you need to put "${Name}" in the "extensions" section. Do you want to do that now?`,
  'Unsupported missing extension _.': (Name: string) =>
    `"${Name}" is missing in the "extensions" section; this extension might not yet be supported by this version of NetLogo.`,
  'Unsupported extension _.': (Name: string) =>
    `The extension "${Name}" is not supported in this editor.`,
  'Term _ already used.': (Name: string) =>
    `"${Name}" is already used. Try a different name.`,
  'Invalid breed procedure _': (Name: string) =>
    `It seems that you forgot to declare "${Name}" as a breed. Do you want to do that now?`,
  'Missing command before _': (Name: string) =>
    `The statement "${Name}" needs to start with a command. What do you want to do with it?`,
  'Improperly placed procedure _': (Name: string) =>
    `The procedure "${Name}" cannot be written prior to global statements. Do you want to move the procedure?`,
  'Unmatched item _': (Current: string, Expected: string) =>
    `This "${Current}" needs a matching ${Expected}.`,
  'Invalid context _.': (Current: string, Expected: string) =>
    `The context for this code block is invalid.`,

  // Help messages
  '~VariableName': (Name: string) => `A (unknown) variable. `,
  '~ProcedureName': (Name: string) => `The name of a procedure. `,
  '~Arguments': (Name: string) => `The name of an argument. `,
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
    `Comments do nothing in the program, but could help others read the code. `,
  '~Globals/Identifier': (Name: string) => `A code-defined global variable. `,
  '~WidgetGlobal': (Name: string) => `A widget-defined global variable. `,
  '~BreedVars/Identifier': (Name: string) =>
    `A model-defined variable for a breed. `,
  '~BreedPlural': (Name: string) =>
    `The plural name of a model-defined breed. `,
  '~BreedSingular': (Name: string) =>
    `The singular name of a model-defined breed. `,
  '~BreedVariable': (Name: string) =>
    `A custom variable for the "${Name}" breed. `,
  '~LocalVariable': (Name: string) =>
    `A local variable within the "${
      Name.includes('{anonymous}') ? '{anonymous}' : Name
    }" procedure or reporter. `,
  '~BreedReporter': (Name: string) => `A reporter for the "${Name}" breed. `,
  '~CustomReporter': (Name: string) => `A user-defined reporter. `,
  '~BreedCommand': (Name: string) => `A command for the "${Name}" breed. `,
  '~CustomCommand': (Name: string) => `A user-defined command. `,

  // Chat and AI assistant
  Reconnect: () => `Reconnect`,
  'Connection to server failed _': (Error: string) =>
    `Sorry, the connection to our server failed. Code ${Error}.`,
};

export { en_us };
