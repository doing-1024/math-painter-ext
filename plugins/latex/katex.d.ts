declare module '*/katex.mjs' {
  const katex: {
    renderToString(tex: string, options?: Record<string, unknown>): string;
  };
  export default katex;
}
