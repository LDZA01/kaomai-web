import { useEffect, useState } from 'react';
import { mockUsers } from '../data/mockData';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { UserProfile, UserRole } from '../types';

const toProfile = (sessionUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }): UserProfile => ({
  id: sessionUser.id,
  email: sessionUser.email || '',
  role: (sessionUser.user_metadata?.role as UserRole) || 'shelter',
  displayName:
    (sessionUser.user_metadata?.display_name as string) || sessionUser.email || 'Kao Mai user',
});

const useAuth = () => {
  const [user, setUser] = useState<UserProfile | null>(mockUsers[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ? toProfile(data.session.user) : null);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ? toProfile(session.user) : null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);

    if (!isSupabaseConfigured) {
      const fallbackUser = mockUsers.find((item) => item.email === email) || mockUsers[0];
      setUser(fallbackUser);
      setLoading(false);
      return { user: fallbackUser, error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    return { user: data.user, error };
  };

  const signUp = async (email: string, password: string, role: UserRole, displayName: string) => {
    setLoading(true);

    if (!isSupabaseConfigured) {
      const mockUser = { id: crypto.randomUUID(), email, role, displayName };
      setUser(mockUser);
      setLoading(false);
      return { user: mockUser, error: null };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          display_name: displayName,
        },
      },
    });

    setLoading(false);
    return { user: data.user, error };
  };

  const signOut = async () => {
    setLoading(true);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setLoading(false);
  };

  return { user, loading, signIn, login: signIn, signUp, signOut };
};

export default useAuth;
export { useAuth };
