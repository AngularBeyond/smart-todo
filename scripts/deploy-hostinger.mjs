#!/usr/bin/env node

import { spawn } from 'node:child_process';
import path from 'node:path';
import readline from 'node:readline';

const target = process.argv[2] || process.env.DEPLOY_TARGET;

if (!target || !['web', 'api'].includes(target)) {
  console.error('Usage: node scripts/deploy-hostinger.mjs [web|api]');
  process.exit(1);
}

const API_TOKEN = process.env.HOSTINGER_API_TOKEN;
const USERNAME = process.env.HOSTINGER_USERNAME || 'u297922397';

if (!API_TOKEN) {
  console.error('Error: HOSTINGER_API_TOKEN environment variable is required.');
  process.exit(1);
}

class McpClient {
  constructor(apiToken) {
    this.apiToken = apiToken;
    this.process = null;
    this.rl = null;
    this.requestId = 0;
    this.pending = new Map();
  }

  async start() {
    this.process = spawn('npx', ['-y', 'hostinger-api-mcp@latest'], {
      env: {
        ...process.env,
        API_TOKEN: this.apiToken,
      },
      stdio: ['pipe', 'pipe', 'inherit'],
    });

    this.rl = readline.createInterface({
      input: this.process.stdout,
      terminal: false,
    });

    this.rl.on('line', (line) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith('{')) return;
      try {
        const msg = JSON.parse(trimmed);
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) {
            reject(new Error(`MCP error ${msg.error.code}: ${msg.error.message}`));
          } else {
            resolve(msg.result);
          }
        }
      } catch {
        // Ignore non-json or partial lines
      }
    });

    this.process.on('error', (err) => {
      console.error('Hostinger MCP process error:', err);
    });

    // Initialize MCP
    await this.request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'hostinger-deploy-script', version: '1.0.0' },
    });

    this.notify('notifications/initialized', {});
  }

  notify(method, params = {}) {
    if (!this.process || !this.process.stdin.writable) return;
    const payload = JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n';
    this.process.stdin.write(payload);
  }

  request(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      this.pending.set(id, { resolve, reject });
      const payload = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';
      this.process.stdin.write(payload);
    });
  }

  async execute(operation, params = {}) {
    const res = await this.request('tools/call', {
      name: 'execute',
      arguments: { operation, params },
    });

    if (res?.content?.[0]?.text) {
      try {
        return JSON.parse(res.content[0].text);
      } catch {
        return res.content[0].text;
      }
    }
    return res;
  }

  close() {
    if (this.process) {
      this.process.kill();
    }
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function deployWeb(client) {
  const domain = 'smart-todo.angularbeyond.com';
  const buildPath = path.resolve('./smart-todo/dist/smart-todo/browser');
  console.log(`[DEPLOY:WEB] Deploying static build from ${buildPath} to ${domain}...`);

  const result = await client.execute('hosting_deploy', {
    domain,
    path: buildPath,
    type: 'static',
  });

  console.log('[DEPLOY:WEB] Deployment result:', JSON.stringify(result, null, 2));
  console.log('[DEPLOY:WEB] Successfully deployed smart-todo frontend!');
}

async function deployApi(client) {
  const domain = 'todo-api.angularbeyond.com';
  console.log(`[DEPLOY:API] Configuring environment variables on Hostinger for ${domain}...`);

  const jwtAccess = process.env.JWT_ACCESS_SECRET || '044aa6d71582ca9cf6a152478f1ee7db8b7f8c89e1e55ec406614b4758fbb056';
  const jwtRefresh = process.env.JWT_REFRESH_SECRET || 'ae41c84a64edc64745ba89bb1f8ca9fbbeec7fd17f6d26ceb4c1db16ca425d3c';

  await client.execute('hosting_nodejs_replace-environment-variables', {
    domain,
    username: USERNAME,
    env_vars: [
      {
        key: 'DATABASE_URL',
        value: 'mysql://u297922397_todo_user:St9_rhffCETFK4sZdSkXT97%23uCXD@127.0.0.1:3306/u297922397_smart_todo',
      },
      { key: 'NODE_ENV', value: 'production' },
      { key: 'FRONTEND_URL', value: 'https://smart-todo.angularbeyond.com' },
      { key: 'JWT_ACCESS_SECRET', value: jwtAccess },
      { key: 'JWT_REFRESH_SECRET', value: jwtRefresh },
      { key: 'PORT', value: '3000' },
    ],
  });

  const apiPath = path.resolve('./smart-todo-api');
  console.log(`[DEPLOY:API] Uploading and triggering NestJS build from ${apiPath}...`);

  const deployRes = await client.execute('hosting_deploy', {
    domain,
    path: apiPath,
    type: 'nodejs',
    appType: 'nest',
    buildScript: 'build',
    entryFile: 'main.js',
    outputDirectory: 'dist',
    nodeVersion: 22,
    packageManager: 'npm',
  });

  console.log('[DEPLOY:API] Build initiated:', deployRes);

  console.log('[DEPLOY:API] Polling build status on Hostinger...');
  let attempts = 0;
  const maxAttempts = 40; // up to ~3.5 minutes

  while (attempts < maxAttempts) {
    attempts++;
    await sleep(6000);

    const status = await client.execute('hosting_get-deployment', { domain });
    const buildState = status?.build?.state;
    console.log(`[DEPLOY:API] Attempt ${attempts}: State = ${buildState}`);

    if (buildState === 'completed') {
      console.log('[DEPLOY:API] Deployment completed successfully!');
      return;
    }

    if (buildState === 'failed') {
      console.error('[DEPLOY:API] Build failed on Hostinger!');
      if (status?.logs?.logs) {
        console.error(status.logs.logs);
      }
      process.exit(1);
    }
  }

  console.warn('[DEPLOY:API] Timeout reached while polling build state. Check Hostinger dashboard.');
}

async function main() {
  const client = new McpClient(API_TOKEN);
  try {
    await client.start();
    if (target === 'web') {
      await deployWeb(client);
    } else if (target === 'api') {
      await deployApi(client);
    }
  } catch (err) {
    console.error(`[DEPLOY:${target.toUpperCase()}] Deployment failed:`, err);
    process.exit(1);
  } finally {
    client.close();
  }
}

main();
