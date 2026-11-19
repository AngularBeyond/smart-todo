import type { IncomingMessage, ServerResponse } from 'node:http';

type HandlerFn = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

let cachedHandler: HandlerFn | null = null;

export default async function (req: IncomingMessage, res: ServerResponse) {
  if (!cachedHandler) {
    const mod = await import('../smart-todo-api/dist/serverless.js');
    cachedHandler = (mod.default ?? mod) as HandlerFn;
  }
  return cachedHandler(req, res);
}
