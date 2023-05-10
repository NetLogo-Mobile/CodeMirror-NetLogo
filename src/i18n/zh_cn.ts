const zh_cn: Record<string, Function> = {
  // Buttons
  Add: () => '添加',

  // Linting messages
  'Unrecognized breed name _': (Name: string) =>
    `未能识别出名为 "${Name}" 的海龟种类。种类需要在代码的开头处进行定义。`,
  'Unrecognized identifier _': (Name: string) =>
    `未能识别 "${Name}"。是否忘记定义它了？`,
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
    `你需要将扩展 "${Name}" 放进 "extensions" 中。想现在试试吗？`,
  'Unsupported missing extension _.': (Name: string) =>
    `你需要将扩展 "${Name}" 放进 "extensions" 中，但是这个编辑器不支持它。`,
  'Invalid context _.': (Prior: string, New: string, Primitive: string) =>
    `根据之前的语句，这段代码中只能使用 "${Prior}" 语句，但 "${Primitive}" 却只能用于 "${New}"。`,
  'Duplicate global statement _': (Name: string) =>
    `全局声明 "${Name}" 已经被定义过了。你想合并吗？`,
  'Infinite loop _': (Name: string) =>
    `这个 "${Name}" 循环将永远运行下去，可能会阻塞模型。你想将它改成 "go" 循环吗？`,
  'Argument is reserved _': (Name: string) =>
    `参数名称 "${Name}" 和 NetLogo 的关键字重复了。你想换一个名字吗？`,
  'Argument is invalid _': (Name: string) =>
    `参数名称 "${Name}" 不可用。你想换一个名字吗？`,

  // Agent types
  Observer: () => '观察者',
  Turtle: () => '海龟',
  Turtles: () => '海龟们',
  Patch: () => '格子',
  Patches: () => '格子们',
  Link: () => '链接',
  Links: () => '链接们',
  Utility: () => '工具',

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

  // Chat and AI interface
  Reconnect: () => `重新连接`,
  RunCode: () => `运行代码`,
  'Trying to run the code': () => `尝试运行代码……`,
  FixCode: () => `修复代码`,
  AskCode: () => `提问`,
  AddCode: () => `放入作品`,
  'Trying to add the code': () => `尝试将代码放入作品……`,
  PreviousVersion: () => `后退`,
  NextVersion: () => `前进`,
  'Expand messages _': (Number: number) => `展开 ${Number} 条消息`,
  FullText: () => `阅读全文`,
  SeeAlso: () => `参见`,

  // Chat and execution messages
  'Connection to server failed _': (Error: string) =>
    `抱歉，和服务器的连接中断了。代码 ${Error}。`,
  'Summary of request': () => `简单总结我的请求的要点：`,
  'We need to fix the following errors _': (Number: number) =>
    `我们需要先修复代码中的 ${Number} 个错误（用___红色波浪线___标记）。`,
  'Successfully executed': () => `成功执行了代码。`,
  'Runtime error _': (Error: string) => `运行时错误：${Error}`,
  'Compile error _': (Error: string) => `抱歉，未能理解你输入的命令：${Error}`,
  'Showing full text help of _': (Name: string) =>
    `显示 [${Name}](<observer=help ${Name} -full>) 的帮助文档。`,

  // Default messages
  'Command center welcome (user)': () => `这是哪儿？我应该怎么开始使用？`,
  'Command center welcome (command)': () =>
    `你好！这里是控制台。你可以在这里输入 NetLogo 命令并立即执行。还有许多值得探索的功能，例如：`,
  'Command center welcome (assistant)': () =>
    `你好！我是你的助手。我可以帮助你学习 NetLogo 或创作你的作品。还有许多值得探索的功能，例如：`,
  'Run NetLogo code directly': () => `直接运行 **NetLogo** 代码`,
  'Check out the code tab': () => `查看作品的**代码**`,
  'Talk to the computer in natural languages': () => `用**自然语言**写代码`,
  'Look for the documentation': () => `查看 NetLogo 语言的**帮助文档**`,
};

export { zh_cn };
