/**
 * Demo data for running the Vault dashboard without a live backend cluster.
 * Activated automatically when:
 *   - VAULT_DEMO_MODE=true is set in environment variables, OR
 *   - No VAULT_GATEWAY_URL is configured and VAULT_MODE is not 'simulator'
 *     (i.e. there is no backend cluster to connect to)
 */

const now = Date.now()

export function isDemoMode(): boolean {
  // Always run in demo mode as requested by the user.
  // This guarantees the frontend works without needing a local backend, Docker, or a tunnel.
  return true;
}

export const DEMO_TOKEN = 'vault-demo-access-token-2024'

export function demoClusterSnapshot() {
  return {
    mode: 'durable',
    epoch: 42,
    metadata: { mode: 'distributed-raft', healthy: true, revision: 187, highlyAvailable: true },
    role: 'admin',
    nodes: [
      {
        id: 'n1', url: 'https://node-1.vault.internal:7401', domain: 'rack-a-host-1',
        draining: false, status: 'ready', objects: 47, bytes: 128974520,
        freeBytes: 95032811520, inflight: 0, corrupt: 0, scrubbed: 1024, corruptIds: [], up: true,
        lastSeen: now,
      },
      {
        id: 'n2', url: 'https://node-2.vault.internal:7402', domain: 'rack-a-host-2',
        draining: false, status: 'ready', objects: 45, bytes: 119843210,
        freeBytes: 95032811520, inflight: 0, corrupt: 0, scrubbed: 1024, corruptIds: [], up: true,
        lastSeen: now,
      },
      {
        id: 'n3', url: 'https://node-3.vault.internal:7403', domain: 'rack-b-host-3',
        draining: false, status: 'ready', objects: 46, bytes: 124532100,
        freeBytes: 95032811520, inflight: 0, corrupt: 0, scrubbed: 1024, corruptIds: [], up: true,
        lastSeen: now,
      },
      {
        id: 'n4', url: 'https://node-4.vault.internal:7404', domain: 'rack-b-host-4',
        draining: false, status: 'ready', objects: 44, bytes: 112458930,
        freeBytes: 95032811520, inflight: 0, corrupt: 0, scrubbed: 1024, corruptIds: [], up: true,
        lastSeen: now,
      },
      {
        id: 'n5', url: 'https://node-5.vault.internal:7405', domain: 'rack-c-host-5',
        draining: false, status: 'ready', objects: 43, bytes: 108732450,
        freeBytes: 95032811520, inflight: 0, corrupt: 0, scrubbed: 1024, corruptIds: [], up: true,
        lastSeen: now,
      },
    ],
    buckets: [
      { name: 'default', n: 3, w: 2, r: 2, sloppy: false, objects: 9, bytes: 4267005 },
      { name: 'backups', n: 3, w: 3, r: 3, sloppy: false, objects: 5, bytes: 82451200 },
      { name: 'media', n: 2, w: 2, r: 2, sloppy: true, objects: 3, bytes: 15728640 },
    ],
    objects: 17,
    logicalBytes: 102446845,
    physicalBytes: 594541210,
    underReplicated: 0,
    corruptReplicas: 0,
    counters: { writes: 234, reads: 1847, deletes: 12, errors: 0, repairs: 7, repairBytes: 2457600, checksumFailures: 0 },
    repair: { running: false, last: { at: now - 3600000, examined: 17, replicasRepaired: 0, bytesMoved: 0 } },
    metrics: Array.from({ length: 60 }, (_, i) => ({
      ts: now - (60 - i) * 1000,
      puts: Math.floor(Math.random() * 5),
      gets: Math.floor(Math.random() * 20),
      deletes: 0,
      errors: 0,
    })),
    latency: { p50: 4, p99: 18 },
    events: [
      { id: 'evt-1', ts: now - 120000, level: 'info', kind: 'repair', message: 'Integrity scan completed: 17 objects examined, 0 repairs needed.' },
      { id: 'evt-2', ts: now - 3600000, level: 'info', kind: 'node', message: 'Node n5 joined the cluster with 43 replicas.' },
      { id: 'evt-3', ts: now - 7200000, level: 'info', kind: 'repair', message: 'Automatic repair: 2 under-replicated objects restored to full durability.' },
      { id: 'evt-4', ts: now - 14400000, level: 'info', kind: 'bucket', message: 'Bucket "backups" created with replication policy n=3 w=3 r=3.' },
    ],
    limits: { maxObjectBytes: 1073741824, maxInflight: 32, rpcTimeoutMs: 30000 },
    durability: { directorySync: true, obsoleteReplicaGc: true },
  }
}

const demoObjects: Record<string, Array<{
  key: string; bucket: string; size: number; sha256: string;
  version: string; holders: string[]; createdAt: number; contentType: string;
}>> = {
  default: [
    { key: 'config.json', bucket: 'default', size: 2048, sha256: 'a1b2c3d4e5f6', version: 'v1', holders: ['n1', 'n2', 'n3'], createdAt: now - 86400000, contentType: 'application/json' },
    { key: 'readme.md', bucket: 'default', size: 8192, sha256: 'b2c3d4e5f6a1', version: 'v1', holders: ['n1', 'n3', 'n4'], createdAt: now - 172800000, contentType: 'text/markdown' },
    { key: 'schema.sql', bucket: 'default', size: 15360, sha256: 'c3d4e5f6a1b2', version: 'v2', holders: ['n2', 'n3', 'n5'], createdAt: now - 259200000, contentType: 'application/sql' },
    { key: 'certificates/tls.pem', bucket: 'default', size: 4096, sha256: 'd4e5f6a1b2c3', version: 'v1', holders: ['n1', 'n2', 'n4'], createdAt: now - 345600000, contentType: 'application/x-pem-file' },
    { key: 'secrets/api-keys.enc', bucket: 'default', size: 1024, sha256: 'e5f6a1b2c3d4', version: 'v3', holders: ['n1', 'n3', 'n5'], createdAt: now - 432000000, contentType: 'application/octet-stream' },
    { key: 'manifests/deploy.yaml', bucket: 'default', size: 6144, sha256: 'f6a1b2c3d4e5', version: 'v1', holders: ['n2', 'n4', 'n5'], createdAt: now - 518400000, contentType: 'application/yaml' },
    { key: 'logs/access-2024.log', bucket: 'default', size: 1048576, sha256: 'a2b3c4d5e6f7', version: 'v1', holders: ['n1', 'n2', 'n3'], createdAt: now - 604800000, contentType: 'text/plain' },
    { key: 'data/users.csv', bucket: 'default', size: 524288, sha256: 'b3c4d5e6f7a2', version: 'v4', holders: ['n3', 'n4', 'n5'], createdAt: now - 691200000, contentType: 'text/csv' },
    { key: 'images/logo.svg', bucket: 'default', size: 32768, sha256: 'c4d5e6f7a2b3', version: 'v1', holders: ['n1', 'n2', 'n5'], createdAt: now - 777600000, contentType: 'image/svg+xml' },
  ],
  backups: [
    { key: 'db-snapshot-2024-09-28.sql.gz', bucket: 'backups', size: 52428800, sha256: 'd5e6f7a2b3c4', version: 'v1', holders: ['n1', 'n2', 'n3'], createdAt: now - 172800000, contentType: 'application/gzip' },
    { key: 'db-snapshot-2024-09-27.sql.gz', bucket: 'backups', size: 10485760, sha256: 'e6f7a2b3c4d5', version: 'v1', holders: ['n2', 'n3', 'n4'], createdAt: now - 259200000, contentType: 'application/gzip' },
    { key: 'db-snapshot-2024-09-26.sql.gz', bucket: 'backups', size: 10485760, sha256: 'f7a2b3c4d5e6', version: 'v1', holders: ['n3', 'n4', 'n5'], createdAt: now - 345600000, contentType: 'application/gzip' },
    { key: 'config-backup.tar.gz', bucket: 'backups', size: 5242880, sha256: 'a3b4c5d6e7f8', version: 'v1', holders: ['n1', 'n4', 'n5'], createdAt: now - 432000000, contentType: 'application/gzip' },
    { key: 'media-archive-sept.tar', bucket: 'backups', size: 3808000, sha256: 'b4c5d6e7f8a3', version: 'v1', holders: ['n1', 'n2', 'n5'], createdAt: now - 518400000, contentType: 'application/x-tar' },
  ],
  media: [
    { key: 'uploads/presentation.pdf', bucket: 'media', size: 10485760, sha256: 'c5d6e7f8a3b4', version: 'v1', holders: ['n1', 'n3'], createdAt: now - 86400000, contentType: 'application/pdf' },
    { key: 'uploads/demo-video.mp4', bucket: 'media', size: 4194304, sha256: 'd6e7f8a3b4c5', version: 'v1', holders: ['n2', 'n4'], createdAt: now - 172800000, contentType: 'video/mp4' },
    { key: 'uploads/dashboard-screenshot.png', bucket: 'media', size: 1048576, sha256: 'e7f8a3b4c5d6', version: 'v1', holders: ['n3', 'n5'], createdAt: now - 259200000, contentType: 'image/png' },
  ],
}

export function addDemoObject(bucket: string, key: string, size: number, contentType: string) {
  if (!demoObjects[bucket]) {
    demoObjects[bucket] = []
  }
  demoObjects[bucket].unshift({
    key,
    bucket,
    size,
    sha256: 'a1b2c3d4e5f6',
    version: 'v1',
    holders: ['n1', 'n2', 'n3'],
    createdAt: Date.now(),
    contentType: contentType || 'application/octet-stream',
  })
}

export function demoObjectListing(bucket: string) {
  return {
    items: demoObjects[bucket] || [],
    nextCursor: null,
  }
}
