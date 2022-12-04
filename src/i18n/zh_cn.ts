const zh_cn: Record<string, Function> = {
  'Unrecognized breed name _': (Name: string) =>
    `未能识别出名为 "${Name}" 的海龟种类。种类需要在代码的开头处进行定义。`,
  'Unrecognized identifier _': (Name: string) =>
    `未能识别 "${Name}"。请检查你的拼写是否正确。`,
  'Unrecognized global statement _': (Name: string) =>
    `未能识别出名为 "${Name}" 的全局声明。请检查你的拼写是否正确。`,
  'Unrecognized statement _': (Name: string) =>
    `"${Name}" 似乎不是合理的 NetLogo 代码。`,
};

export { zh_cn };
