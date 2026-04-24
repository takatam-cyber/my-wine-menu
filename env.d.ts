// env.d.ts
interface CloudflareEnv {
  DB: D1Database;
  AI: {
    run: (model: string, options: any) => Promise<any>;
  };
}

declare module '@cloudflare/next-on-pages' {
  export function getRequestContext(): {
    env: CloudflareEnv;
    context: {
      waitUntil: (promise: Promise<any>) => void;
    };
  };
}
