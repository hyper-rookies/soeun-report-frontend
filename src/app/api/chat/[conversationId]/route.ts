import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const backendUrl = process.env.BACKEND_URL;

  if (!backendUrl) {
    return new Response('BACKEND_URL not configured', { status: 500 });
  }

  const body = await request.text();
  const authHeader = request.headers.get('Authorization');

  const backendResponse = await fetch(
    `${backendUrl}/api/chat/${conversationId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      body,
    }
  );

  if (!backendResponse.ok || !backendResponse.body) {
    return new Response('Backend error', { status: backendResponse.status });
  }

  // SSE 스트림을 버퍼링 없이 그대로 통과
  return new Response(backendResponse.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      Connection: 'keep-alive',
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const backendUrl = process.env.BACKEND_URL;

  if (!backendUrl) {
    return new Response('BACKEND_URL not configured', { status: 500 });
  }

  const authHeader = request.headers.get('Authorization');
  const searchParams = request.nextUrl.searchParams.toString();
  const queryString = searchParams ? `?${searchParams}` : '';

  const backendResponse = await fetch(
    `${backendUrl}/api/chat/${conversationId}${queryString}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    }
  );

  const data = await backendResponse.json();
  return Response.json(data, { status: backendResponse.status });
}
