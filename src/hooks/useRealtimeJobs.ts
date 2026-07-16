import { useEffect, useState } from 'react';
import { mockJobs } from '../data/mockData';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Job } from '../types';

const mapJob = (job: Record<string, any>): Job => ({
  id: job.id,
  employerId: job.employer_id,
  title: job.title,
  description: job.job_description,
  requiredSkills: job.required_skills || [],
  location: job.location,
  dailyWage: Number(job.daily_wage),
  status: job.status || 'open',
});

const useRealtimeJobs = () => {
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const fetchJobs = async () => {
      const { data, error } = await supabase.from('jobs').select('*');

      if (error) {
        console.error('Error fetching jobs:', error);
      } else if (data) {
        setJobs(data.map(mapJob));
      }
      setLoading(false);
    };

    fetchJobs();

    const channel = supabase
      .channel('jobs-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, fetchJobs)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { jobs, loading };
};

export default useRealtimeJobs;
