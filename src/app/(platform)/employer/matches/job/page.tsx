import { Suspense } from 'react';
import { EmployerJobCandidatesPage } from '@/components/platform/EmployerJobCandidatesPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-[16px] bg-white" />}>
      <EmployerJobCandidatesPage />
    </Suspense>
  );
}
