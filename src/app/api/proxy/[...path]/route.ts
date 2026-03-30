const BASE_URL = process.env.CENTRAL_AGENT_URL || 'http://localhost:8000'

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const url = new URL(request.url)
  const targetPath = '/' + path.join('/')
  const targetUrl = `${BASE_URL}${targetPath}${url.search}`

  const res = await fetch(targetUrl, { cache: 'no-store' })
  const data = await res.json()

  return Response.json(data, { status: res.status })
}
