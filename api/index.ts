import type { IncomingMessage, ServerResponse } from 'node:http';
import handler from '../smart-todo-api/dist/serverless.js';

export default async function (req: IncomingMessage, res: ServerResponse) {
  return handler(req, res);
}
