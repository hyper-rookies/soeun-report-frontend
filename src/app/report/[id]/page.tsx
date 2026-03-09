'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { conversationService } from '@/services';
import { ReportView } from '@/components/report/ReportView';
import { Spinner } from '@/components/ui/Spinner';
import { Conversation } from '@/types/chat';

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();

  const [conv, setConv] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    conversationService
      .getConversation(id)
      .then(setConv)
      .catch(() => setError('리포트를 불러올 수 없어요.'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="flex-1 overflow-auto">
      {loading && (
        <div className="flex items-center justify-center h-full">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center justify-center h-full">
          <p className="text-[14px]" style={{ color: 'var(--neutral-500)' }}>
            {error}
          </p>
        </div>
      )}

      {!loading && !error && conv && (
        <ReportView
          messages={conv.messages}
          title="주간 리포트"
          createdAt={new Date(conv.createdAt).toISOString()}
        />
      )}
    </div>
  );
}
