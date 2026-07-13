declare module '*/katex.mjs' {
  const katex: {
    renderToString(tex: string, options?: Record<string, unknown>): string;
  };
  export default katex;
}

// Injected by build.mjs: the full KaTeX stylesheet text (fonts keep a
// __MP_KATEX_BASE__ placeholder resolved at runtime to the host origin).
declare const __KATEX_CSS__: string;
