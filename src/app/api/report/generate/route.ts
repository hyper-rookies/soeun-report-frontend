export const maxDuration = 300; // 5분 (App Router)

export async function POST(request: Request) {
  console.log('[route] BACKEND_URL:', process.env.BACKEND_URL);
  console.log('[route] INTERNAL_API_KEY:', process.env.INTERNAL_API_KEY ? '설정됨' : '없음');
  try {
    const authHeader = request.headers.get('Authorization');

    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      return Response.json(
        { success: false, message: 'BACKEND_URL 환경변수가 설정되지 않았습니다.' },
        { status: 500 },
      );
    }

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
  } catch (error) {
    console.error('[report/generate] 에러:', error);
    return Response.json(
      { success: false, message: '리포트 생성 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
