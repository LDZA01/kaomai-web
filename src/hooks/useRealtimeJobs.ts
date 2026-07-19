import { useEffect, useState } from 'react';
import { getJobs } from '../lib/db';
import type { Job } from '../types';

/**
 * Fetches jobs for a specific employer.
 * Falls back to mock data when Supabase is not configured (via db.ts).
 */
const useRealtimeJobs = (employerId: string) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employerId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchJobs = async () => {
      setLoading(true);
      try {
        const data = await getJobs(employerId);
        if (!cancelled) setJobs(data);
      } catch (err) {
        console.error('[useRealtimeJobs] fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchJobs();

    return () => { cancelled = true; };
  }, [employerId]);

  const refetch = async () => {
    if (!employerId) return;
    try {
      const data = await getJobs(employerId);
      setJobs(data);
    } catch (err) {
      console.error('[useRealtimeJobs] refetch error:', err);
    }
  };

  return { jobs, loading, refetch };
};

export default useRealtimeJobs;
