const zh_cn: Record<string, Function> = {
  'Unrecognized breed name _': (Name: string) =>
    `未能识别出名为 "${Name}" 的海龟种类。种类需要在代码的开头处进行定义。`,
  'Unrecognized identifier _': (Name: string) =>
    `未能识别 "${Name}"。请检查你的拼写是否正确。`,
  'Unrecognized global statement _': (Name: string) =>
    `未能识别出名为 "${Name}" 的全局声明。请检查你的拼写是否正确。`,
  'Unrecognized statement _': (Name: string) =>
    `"${Name}" 似乎不是合理的 NetLogo 代码。`,

  '~VariableName': (Name: string) => `变量名称。`,
  '~ProcedureName': (Name: string) => `过程或函数的名称。`,
  '~Arguments/Identifier': (Name: string) => `参数名称。`,
  '~PatchVar': (Name: string) => `格子的内置变量。`,
  '~TurtleVar': (Name: string) => `海龟的内置变量。`,
  '~LinkVar': (Name: string) => `链接的内置变量。`,
  '~Reporter': (Name: string) => `NetLogo 语言的内置函数。`,
  '~Command': (Name: string) => `NetLogo 语言的内置命令。`,
  '~Constant': (Name: string) => `NetLogo 语言规定的常量。`,
  '~Extension': (Name: string) => `NetLogo 语言的扩展。`,
  '~String': (Name: string) => `字符串，或者说一串文字。`,
  '~LineComment': (Name: string) =>
    `注释在代码中没有直接作用，但可以帮助其他人理解代码。`,
  '~Globals/Identifier': (Name: string) => `模型中定义的全局变量。`,
  '~BreedVars/Identifier': (Name: string) =>
    `某类模型中定义的海龟或链接具有的变量。`,
  '~BreedPlural': (Name: string) => `某类模型中定义的海龟的复数名称。`,
  '~BreedSingular': (Name: string) => `某类模型中定义的海龟的单数名称。`,
};

export { zh_cn };
