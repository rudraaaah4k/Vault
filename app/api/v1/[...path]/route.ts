import { NextRequest, NextResponse } from 'next/server'
import { isDemoMode, demoClusterSnapshot, demoObjectListing, addDemoObject } from '@/lib/vault/demo-data'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function demoResponse(req: NextRequest, path: string[]) {
  const joined = path.join('/')

  // GET /v1/cluster
  if (joined === 'cluster' && req.method === 'GET') {
    return NextResponse.json(demoClusterSnapshot(), { headers: { 'Cache-Control': 'no-store' } })
  }

  // GET /v1/objects/:bucket  (object listing)
  if (path[0] === 'objects' && path.length === 2 && req.method === 'GET') {
    return NextResponse.json(demoObjectListing(path[1]), { headers: { 'Cache-Control': 'no-store' } })
  }

  // POST /v1/repair
  if (joined === 'repair' && req.method === 'POST') {
    return NextResponse.json({ ok: true, message: 'Demo: integrity scan completed.' })
  }

  // POST /v1/buckets (create bucket)
  if (joined === 'buckets' && req.method === 'POST') {
    return NextResponse.json({ ok: true, message: 'Demo: bucket created.' })
  }

  // POST /v1/nodes (add node)
  if (joined === 'nodes' && req.method === 'POST') {
    return NextResponse.json({ ok: true, message: 'Demo: node registered.' })
  }

  // POST /v1/nodes/:id/drain
  if (path[0] === 'nodes' && path.length === 3 && path[2] === 'drain' && req.method === 'POST') {
    return NextResponse.json({ ok: true, message: 'Demo: node drain started.' })
  }

  // PUT /v1/objects/:bucket/:key (upload — in demo we just accept it)
  if (path[0] === 'objects' && path.length >= 3 && req.method === 'PUT') {
    const bucket = path[1]
    const key = decodeURIComponent(path.slice(2).join('/'))
    const size = Number(req.headers.get('content-length') || 1024)
    const contentType = req.headers.get('content-type') || 'application/octet-stream'
    addDemoObject(bucket, key, size, contentType)
    return NextResponse.json({ ok: true, version: 'demo-v1' }, { status: 200 })
  }

  // POST /v1/uploads (multipart upload start)
  if (path[0] === 'uploads' && path.length === 1 && req.method === 'POST') {
    try {
      const body = await req.clone().json()
      addDemoObject(body.bucket || 'default', body.key || 'upload', 10485760, body.contentType)
    } catch {}
    return NextResponse.json({ uploadId: 'demo-upload-id' }, { status: 200 })
  }

  // PUT /v1/uploads/:id (multipart upload chunk)
  if (path[0] === 'uploads' && path.length === 2 && req.method === 'PUT') {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  // POST /v1/uploads/:id (multipart upload finish)
  if (path[0] === 'uploads' && path.length === 2 && req.method === 'POST') {
    // We don't have bucket/key here without body parsing, so we just return success
    return NextResponse.json({ ok: true, version: 'demo-v1' }, { status: 200 })
  }

  // DELETE /v1/objects/:bucket/:key
  if (path[0] === 'objects' && path.length >= 3 && req.method === 'DELETE') {
    return NextResponse.json({ ok: true, message: 'Demo: object deleted.' })
  }

  // Fallback for any unhandled demo route
  return NextResponse.json(
    { error: 'This action is not available in demo mode.' },
    { status: 501 },
  )
}

async function forward(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const token = req.cookies.get('vault_session')?.value
  if (!token) return NextResponse.json({ error: 'Sign in to your cluster.' }, { status: 401 })

  const { path } = await params

  // Demo mode: return mock data instead of proxying to gateway
  // Always active based on user request.
  if (true || isDemoMode()) {
    return await demoResponse(req, path)
  }

  if (
    !['GET', 'HEAD'].includes(req.method) &&
    req.headers.get('origin') &&
    new URL(req.headers.get('origin')!).host !== req.headers.get('host')
  ) {
    return NextResponse.json({ error: 'Cross-origin request rejected' }, { status: 403 })
  }
  const url = `${process.env.VAULT_GATEWAY_URL || 'http://127.0.0.1:7400'}/v1/${path.map(encodeURIComponent).join('/')}${req.nextUrl.search}`
  const headers = new Headers({ authorization: `Bearer ${token}`, 'Bypass-Tunnel-Reminder': 'true' })
  for (const name of [
    'content-type',
    'content-length',
    'range',
    'if-match',
    'if-none-match',
    'idempotency-key',
    'x-content-sha256',
  ]) {
    const value = req.headers.get(name)
    if (value) headers.set(name, value as string)
  }
  try {
    const init: RequestInit & { duplex?: 'half' } = {
      method: req.method,
      headers,
      cache: 'no-store',
      signal: AbortSignal.any([req.signal, AbortSignal.timeout(180000)]),
    }
    if (!['GET', 'HEAD'].includes(req.method) && req.body) {
      init.body = req.body
      init.duplex = 'half'
    }
    const response = await fetch(url, init)
    const output = new Headers()
    for (const name of [
      'content-type',
      'content-length',
      'content-disposition',
      'content-range',
      'etag',
      'x-content-sha256',
      'x-vault-version',
      'x-vault-served-by',
      'accept-ranges',
      'cache-control',
    ]) {
      const value = response.headers.get(name)
      if (value) output.set(name, value as string)
    }
    output.set('x-content-type-options', 'nosniff')
    return new NextResponse(req.method === 'HEAD' ? null : response.body, {
      status: response.status,
      headers: output,
    })
  } catch {
    return NextResponse.json(
      { error: 'The gateway is unavailable or the request exceeded its deadline.' },
      { status: 503 },
    )
  }
}
export { forward as GET, forward as HEAD, forward as PUT, forward as POST, forward as DELETE }
