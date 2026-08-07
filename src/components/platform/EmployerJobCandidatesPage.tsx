'use client';

import { useSearchParams } from 'next/navigation';
import { MatchesBoard } from '@/components/platform/MatchesBoard';

export function EmployerJobCandidatesPage() {
  const searchParams = useSearchParams();
  return <MatchesBoard role="employer" jobId={searchParams.get('jobId') ?? ''} />;
}
