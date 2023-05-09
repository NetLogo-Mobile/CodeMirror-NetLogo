const zh_cn: Record<string, Function> = {
  // Buttons
  Add: () => '添加',

  // Linting messages
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
  'Invalid for Normal mode _': (Value: string) =>
    `此编辑器模式只用于编辑 NetLogo 模型。`,
  'Invalid for Embedded mode _': (Value: string) =>
    `此编辑器模式只用于编辑 NetLogo 模型中的一小段代码。`,
  'Invalid for Oneline mode _': (Value: string) =>
    `此编辑器模式只用于编辑单行命令或单行函数。`,
  'Invalid for OnelineReporter mode _': (Value: string) =>
    `此编辑器模式只用于编辑单行函数。`,
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
  'Term _ already used.': (Name: string) =>
    `"${Name}" 已经被定义过了。试试换个名字吧。`,
  'Invalid breed procedure _': (Name: string) =>
    `你还没有定义名为 "${Name}" 的种类。想现在试试吗？`,
  'Missing command before _': (Name: string) =>
    `语句 "${Name}" 之前需要一个命令。你打算用它做些什么？`,
  'Improperly placed procedure _': (Name: string) =>
    `过程或函数 "${Name}" 必须放在模型声明的后面。想移动它吗？`,
  'Unmatched item _': (Current: string, Expected: string) =>
    `"${Current}" 需要对应的 ${Expected}。`,
  'Unsupported extension _.': (Name: string) =>
    `这个编辑器不支持扩展 "${Name}"。`,
  'Missing extension _.': (Name: string) =>
    `你似乎需要将扩展 "${Name}" 放进 "extensions" 中。想现在试试吗？`,
  'Unsupported missing extension _.': (Name: string) =>
    `你似乎需要将扩展 "${Name}" 放进 "extensions" 中，但是这个编辑器不支持它。`,
  'Invalid context _.': (Prior: string, New: string, Primitive: string) =>
    `根据之前的语句，这段代码中只能使用 "${Prior}" 语句，但 "${Primitive}" 却只能用于 "${New}"。`,
  'Duplicate global statement _': (Name: string) =>
    `全局声明 "${Name}" 已经被定义过了。你想合并吗？`,
  'Infinite loop _': (Name: string) =>
    `这个 "${Name}" 循环将永远运行下去，可能会阻塞模型。你想将它改成 "go" 循环吗？`,
  'Argument is primitive _': (Name: string) =>
    `The argument "${Name}" is a built-in primitive. Do you want to replace it?`,
  'Argument is unrecognized _': (Name: string) =>
    `The argument "${Name}" is invalid. Do you want to replace it?`,

  // Agent types
  Observer: () => '观察者',
  Turtle: () => '海龟',
  Turtles: () => '海龟们',
  Patch: () => '格子',
  Patches: () => '格子们',
  Link: () => '链接',
  Links: () => '链接们',

  // Help messages
  '~VariableName': (Name: string) => `一个（未知的）变量。`,
  '~ProcedureName': (Name: string) => `过程或函数的名称。`,
  '~Arguments': (Name: string) => `过程或函数定义的参数名称。`,
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
  '~LocalVariable': (Name: string) =>
    `"${
      Name.includes('{anonymous}') ? '{匿名}' : Name
    }" 过程或函数定义的本地变量。 `,
  '~BreedReporter': (Name: string) => `关于 "${Name}" 种类的函数。`,
  '~CustomReporter': (Name: string) => `代码中定义的一个函数。`,
  '~BreedCommand': (Name: string) => `关于 "${Name}" 种类的过程。 `,
  '~CustomCommand': (Name: string) => `代码中定义的一个过程。`,

  // Chat and AI assistant
  Reconnect: () => `重新连接`,
  RunCode: () => `运行代码`,
  'Trying to run the code': () => `尝试运行代码……`,
  FixCode: () => `修复代码`,
  AskCode: () => `提问`,
  AddCode: () => `放入作品`,
  'Trying to add the code': () => `尝试将代码放入作品……`,
  PreviousVersion: () => `后退`,
  NextVersion: () => `前进`,
  'Connection to server failed _': (Error: string) =>
    `抱歉，和服务器的连接中断了。代码 ${Error}。`,
  'Expand messages _': (Number: number) => `展开 ${Number} 条消息`,
  'Summary of request': () => `简单总结我的请求的要点：`,
  'We need to fix the following errors _': (Number: number) =>
    `我们需要先修复代码中的 ${Number} 个错误（用___红色波浪线___标记）。`,
};

export { zh_cn };
