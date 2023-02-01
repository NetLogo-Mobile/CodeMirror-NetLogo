const zh_cn: Record<string, Function> = {
  'Unrecognized breed name _': (Name: string) =>
    `未能识别出名为 "${Name}" 的海龟种类。种类需要在代码的开头处进行定义。`,
  'Unrecognized identifier _': (Name: string) =>
    `未能识别 "${Name}"。请检查你的拼写是否正确。`,
  'Unrecognized global statement _': (Name: string) =>
    `未能识别出名为 "${Name}" 的全局声明。请检查你的拼写是否正确。`,
  'Unrecognized statement _': (Name: string) =>
    `"${Name}" 似乎不是合理的 NetLogo 代码。`,
  'Unsupported statement _': (Name: string) =>
    `此版本 NetLogo 不支持 "${Name}"。`,
  'Problem identifying primitive _. Expected _, found _.': (
    Name: string,
    Expected: string,
    Actual: string
  ) => `"${Name}" 不是有效的原语。预计 "${Expected}" 却得到 "${Actual}"。`,
  'Left args for _. Expected _, found _.': (
    Name: string,
    Expected: string,
    Actual: string
  ) =>
    `原语 "${Name}" 需要 ${Expected} 个左侧参数，但代码中只有 ${Actual} 个。`,
  'Too few right args for _. Expected _, found _.': (
    Name: string,
    Expected: string,
    Actual: string
  ) =>
    `原语 "${Name}" 需要至少 ${Expected} 个右侧参数，但代码中只有 ${Actual} 个。`,
  'Too many right args for _. Expected _, found _.': (
    Name: string,
    Expected: string,
    Actual: string
  ) =>
    `"原语 "${Name}" 需要至多 ${Expected} 个右侧参数，但代码中只有 ${Actual} 个。`,
  'Invalid extension _.': (Name: string) =>
    `看起来你需要在 "extensions" 中加入 "${Name}"。想现在试试吗？`,
  'Breed name _ already used.': (Name: string) =>
    `"${Name}" 已经是另一个种类的名字了。试试换个名字吧。`,
  'Invalid breed procedure _': (Name: string) =>
    `你还没有定义名为 "${Name}" 的种类。想现在试试吗？`,
  'Missing command before _': (Name: string) =>
    `语句 "${Name}" 之前需要一个命令。你打算用它做些什么？`,

  '~VariableName': (Name: string) => `一个（未知的）变量。`,
  '~ProcedureName': (Name: string) => `过程或函数的名称。`,
  '~Arguments/Identifier': (Name: string) => `过程或函数定义的参数名称。`,
  '~PatchVar': (Name: string) => `格子的内置变量。`,
  '~TurtleVar': (Name: string) => `海龟的内置变量。`,
  '~LinkVar': (Name: string) => `链接的内置变量。`,
  '~Reporter': (Name: string) => `NetLogo 语言的内置函数。`,
  '~Command': (Name: string) => `NetLogo 语言的内置命令。`,
  '~Constant': (Name: string) => `NetLogo 语言规定的常量。`,
  '~Extension': (Name: string) => `NetLogo 语言的扩展。`,
  '~Numeric': (Name: string) => `一个数字。`,
  '~String': (Name: string) => `字符串，或者说一串文字。`,
  '~LineComment': (Name: string) =>
    `注释在代码中没有直接作用，但可以帮助其他人理解代码。`,
  '~Globals/Identifier': (Name: string) => `模型代码中定义的全局变量。`,
  '~BreedVars/Identifier': (Name: string) =>
    `某类模型中定义的海龟或链接具有的变量。`,
  '~BreedPlural': (Name: string) => `某类模型中定义的海龟的复数名称。`,
  '~BreedSingular': (Name: string) => `某类模型中定义的海龟的单数名称。`,
  '~WidgetGlobal': (Name: string) => `通过界面组件定义的全局变量。 `,
  '~BreedVariable': (Name: string) => `种类 "${Name}" 定义的变量。`,
  '~LocalVariable': (Name: string) => `"${Name}" 过程或函数定义的本地变量。 `,
};

export { zh_cn };
