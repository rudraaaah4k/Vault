import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import { resolve, join } from 'node:path'
import { existsSync } from 'node:fs'

const root = resolve(import.meta.dirname, '..'),
  directory = join(root, '.vault')
await mkdir(directory, { recursive: true })

// ── 1. Ensure secrets exist ──
const secretsPath = join(directory, 'credentials.json')
let secrets
try {
  secrets = JSON.parse(await readFile(secretsPath, 'utf8'))
} catch (e) {
  if (e.code !== 'ENOENT') throw e
  secrets = { adminToken: randomBytes(32).toString('hex'), nodeToken: randomBytes(32).toString('hex') }
  await writeFile(secretsPath, JSON.stringify(secrets), { mode: 0o600, flag: 'wx' })
}

// ── 2. Start storage nodes + gateway ──
const services = []
const nodes = Array.from({ length: 5 }, (_, i) => ({
  id: `n${i + 1}`,
  url: `http://127.0.0.1:${7401 + i}`,
  domain: `development-node-${i + 1}`,
}))
let stopping = false

function stop() {
  if (stopping) return
  stopping = true
  console.log('\n🛑 Stopping Vault cluster and tunnel...')
  for (const service of services) service.kill()
  setTimeout(() => process.exit(0), 2000).unref()
}

function start(file, env) {
  const child = spawn(process.execPath, [join(root, file)], {
    cwd: root,
    env: { ...process.env, NODE_ENV: 'development', ...env },
    stdio: 'inherit',
    windowsHide: true,
  })
  services.push(child)
  child.on('exit', (code) => {
    if (!stopping) {
      console.error(`❌ ${file} exited (${code}). Stopping.`)
      stop()
    }
  })
}

for (let i = 0; i < nodes.length; i++)
  start('services/storage.mjs', {
    NODE_ID: nodes[i].id,
    PORT: String(7401 + i),
    NODE_TOKEN: secrets.nodeToken,
    DATA_DIR: join(directory, nodes[i].id),
  })

start('services/gateway.mjs', {
  PORT: '7400',
  NODE_TOKEN: secrets.nodeToken,
  ADMIN_TOKEN: secrets.adminToken,
  STORAGE_NODES: JSON.stringify(nodes),
  DATA_DIR: join(directory, 'gateway'),
})

// ── 3. Wait for gateway to become healthy ──
console.log('\n⏳ Waiting for gateway to become healthy...')
for (let attempt = 0; attempt < 30; attempt++) {
  await new Promise((r) => setTimeout(r, 1000))
  try {
    const res = await fetch('http://localhost:7400/healthz', { signal: AbortSignal.timeout(2000) })
    if (res.ok) {
      console.log('✅ Gateway is healthy!')
      break
    }
  } catch {
    // Not ready yet
  }
  if (attempt === 29) {
    console.error('❌ Gateway did not become healthy in 30 seconds.')
    stop()
  }
}

// ── 4. Start Cloudflare Tunnel ──
const cloudflaredPath = join(root, 'cloudflared.exe')
if (!existsSync(cloudflaredPath)) {
  console.log('\n📥 Downloading cloudflared (one-time only)...')
  const response = await fetch('https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe')
  const buffer = Buffer.from(await response.arrayBuffer())
  await writeFile(cloudflaredPath, buffer)
  console.log('✅ cloudflared downloaded!')
}

console.log('\n🚇 Starting Cloudflare Tunnel...')
const tunnel = spawn(cloudflaredPath, ['tunnel', '--url', 'http://localhost:7400'], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
})
services.push(tunnel)

let tunnelUrl = null
function parseTunnelOutput(data) {
  const text = data.toString()
  const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)
  if (match && !tunnelUrl) {
    tunnelUrl = match[0]
    console.log('\n' + '═'.repeat(70))
    console.log('  🎉 VAULT IS LIVE!')
    console.log('═'.repeat(70))
    console.log(`\n  🔗 Tunnel URL:  ${tunnelUrl}`)
    console.log(`  🔑 Login Token: ${secrets.adminToken}`)
    console.log(`\n  📋 Set this in Vercel Environment Variables:`)
    console.log(`     VAULT_GATEWAY_URL = ${tunnelUrl}`)
    console.log(`\n  ⚠️  Keep this terminal open! Press Ctrl+C to stop.`)
    console.log('═'.repeat(70) + '\n')
  }
}

tunnel.stdout.on('data', parseTunnelOutput)
tunnel.stderr.on('data', parseTunnelOutput)

tunnel.on('exit', (code) => {
  if (!stopping) {
    console.error(`❌ Cloudflare tunnel exited (${code}). Restarting in 5s...`)
    setTimeout(() => {
      if (!stopping) {
        console.log('🔄 Restarting tunnel...')
        const newTunnel = spawn(cloudflaredPath, ['tunnel', '--url', 'http://localhost:7400'], {
          cwd: root,
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: true,
        })
        services.push(newTunnel)
        tunnelUrl = null
        newTunnel.stdout.on('data', parseTunnelOutput)
        newTunnel.stderr.on('data', parseTunnelOutput)
      }
    }, 5000)
  }
})

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, stop)
