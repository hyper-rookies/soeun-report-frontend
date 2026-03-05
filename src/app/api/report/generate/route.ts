export async function POST(request: Request) {
  const authHeader  = request.headers.get('Authorization');
  const backendUrl  = process.env.BACKEND_URL;
  const internalKey = process.env.INTERNAL_API_KEY || 'report-internal-key-2026';

  const response = await fetch(`${backendUrl}/api/chat/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Key': internalKey,
      ...(authHeader && { Authorization: authHeader }),
    },
    body: JSON.stringify({ reportType: 'weekly' }),
  });

  const data = await response.json();
  return Response.json(data);
}
