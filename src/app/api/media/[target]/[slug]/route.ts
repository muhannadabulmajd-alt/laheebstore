import { AtlasClientError, atlasMediaResponse } from '@/lib/atlas-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ target: string; slug: string }> },
) {
  const { target, slug } = await params;
  if ((target !== 'products' && target !== 'groups') || !slug || slug.length > 160) {
    return Response.json({ error: 'invalid_media_path' }, { status: 400 });
  }
  const path = `/api/storefront/v1/media/${target}/${encodeURIComponent(slug)}`;
  try {
    const upstream = await atlasMediaResponse(path, request.headers.get('if-none-match'));
    const headers = new Headers();
    for (const name of ['content-type', 'content-length', 'etag']) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    headers.set('Content-Disposition', 'inline');
    return new Response(upstream.status === 304 ? null : upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    const status = error instanceof AtlasClientError && error.status === 404 ? 404 : 502;
    return Response.json({ error: status === 404 ? 'image_not_found' : 'image_unavailable' }, { status });
  }
}
