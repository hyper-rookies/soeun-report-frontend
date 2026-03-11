/**
 * 스트리밍 중인 텍스트에서 ** 쌍이 맞지 않으면 임시로 닫아줌.
 * 스트리밍 완료 후에는 호출하지 않음.
 */
export function sanitizeStreamingMarkdown(text: string): string {
  const count = (text.match(/\*\*/g) || []).length;
  // 홀수 → 닫는 ** 임시 추가
  if (count % 2 !== 0) {
    return text + '**';
  }
  return text;
}
