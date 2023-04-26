/** Log: Log to console if debug is enabled. */
export function Log(...args: any[]) {
  if ((window as any).GalapagosEditor.DebugEnabled) console.log(...args);
}
