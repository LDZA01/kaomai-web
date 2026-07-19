import { useEffect, useState } from 'react';
import { mockUsers } from '../data/mockData';
import {
  createEmployer,
  createShelter,
  fetchEmployerByUserId,
  fetchShelterByUserId,
} from '../lib/db';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Employer, Shelter, UserProfile, UserRole } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OrgInfo {
  shelter: Shelter | null;
  employer: Employer | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const toProfile = (sessionUser: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): UserProfile => ({
  id: sessionUser.id,
  email: sessionUser.email || '',
  role: (sessionUser.user_metadata?.role as UserRole) || 'shelter',
  displayName:
    (sessionUser.user_metadata?.display_name as string) || sessionUser.email || 'Kao Mai user',
});

// Demo account → mock org mapping
const MOCK_ORG: Record<string, OrgInfo> = {
  'user-shelter': {
    shelter: {
      id: 'shelter-1',
      name: 'ศูนย์คนไร้บ้านบ้านใหม่',
      address: 'ปทุมวัน, กรุงเทพมหานคร',
      contactInfo: 'shelter@kaowmai.test',
    },
    employer: null,
  },
  'user-employer': {
    shelter: null,
    employer: {
      id: 'employer-1',
      businessName: 'ครัวเขียว เคเทอริ่ง',
      industry: 'ธุรกิจอาหาร',
      contactInfo: 'employer@kaowmai.test',
    },
  },
};

const emptyOrg: OrgInfo = { shelter: null, employer: null };

// ── Hook ──────────────────────────────────────────────────────────────────────

const useAuth = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [org, setOrg] = useState<OrgInfo>(emptyOrg);
  const [loading, setLoading] = useState(true);

  /** Resolve org from Supabase for a given user profile. */
  const resolveOrgFromDb = async (profile: UserProfile): Promise<OrgInfo> => {
    if (profile.role === 'shelter') {
      const shelter = await fetchShelterByUserId(profile.id);
      return { shelter, employer: null };
    } else {
      const employer = await fetchEmployerByUserId(profile.id);
      return { shelter: null, employer };
    }
  };

  // ── Supabase session listener ──────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        const profile = toProfile(data.session.user);
        setUser(profile);
        setOrg(await resolveOrgFromDb(profile));
      }
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        const profile = toProfile(session.user);
        setUser(profile);
        setOrg(await resolveOrgFromDb(profile));
      } else {
        setUser(null);
        setOrg(emptyOrg);
      }
    });

    return () => { authListener.subscription.unsubscribe(); };
  }, []);

  // ── signIn ────────────────────────────────────────────────────────────────
  const signIn = async (email: string, password: string) => {
    setLoading(true);

    if (!isSupabaseConfigured) {
      const mockUser = mockUsers.find((u) => u.email === email);
      if (!mockUser) {
        setLoading(false);
        return { user: null, error: { message: 'ไม่พบบัญชีนี้ในระบบ' } };
      }
      setUser(mockUser);
      setOrg(MOCK_ORG[mockUser.id] ?? emptyOrg);
      setLoading(false);
      return { user: mockUser, error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user) {
      const profile = toProfile(data.user);
      setUser(profile);
      setOrg(await resolveOrgFromDb(profile));
    }
    setLoading(false);
    return { user: data.user, error };
  };

  // ── signUp ────────────────────────────────────────────────────────────────
  const signUp = async (
    email: string,
    password: string,
    role: UserRole,
    displayName: string,
    orgInfo?: {
      shelterName?: string;
      shelterAddress?: string;
      businessName?: string;
      industry?: string;
    },
  ) => {
    setLoading(true);

    // ── Mock mode ────────────────────────────────────────────────────────────
    if (!isSupabaseConfigured) {
      const newId = crypto.randomUUID();
      const mockUser: UserProfile = { id: newId, email, role, displayName };

      const newOrg: OrgInfo = emptyOrg;
      if (role === 'shelter') {
        newOrg.shelter = {
          id: `shelter-${newId}`,
          name: orgInfo?.shelterName || displayName,
          address: orgInfo?.shelterAddress || '',
          contactInfo: email,
        };
      } else {
        newOrg.employer = {
          id: `employer-${newId}`,
          businessName: orgInfo?.businessName || displayName,
          industry: orgInfo?.industry || '',
          contactInfo: email,
        };
      }

      setUser(mockUser);
      setOrg(newOrg);
      setLoading(false);
      return { user: mockUser, error: null };
    }

    // ── Supabase mode ────────────────────────────────────────────────────────
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, display_name: displayName },
      },
    });

    if (error || !data.user) {
      setLoading(false);
      return { user: null, error };
    }

    const userId = data.user.id;

    // Create shelter or employer record right after registration
    let newOrg: OrgInfo = emptyOrg;
    if (role === 'shelter') {
      const shelter = await createShelter(
        userId,
        orgInfo?.shelterName || displayName,
        orgInfo?.shelterAddress || '',
        email,
      );
      if (!shelter) {
        setLoading(false);
        return {
          user: null,
          error: {
            message:
              'สร้างบัญชีสำเร็จ แต่ไม่สามารถบันทึกข้อมูลศูนย์คนไร้บ้านได้ (โปรดรัน SQL Migration 004_fix_rls.sql ใน Supabase Editor)',
          },
        };
      }
      newOrg = { shelter, employer: null };
    } else {
      const employer = await createEmployer(
        userId,
        orgInfo?.businessName || displayName,
        orgInfo?.industry || '',
        email,
      );
      if (!employer) {
        setLoading(false);
        return {
          user: null,
          error: {
            message:
              'สร้างบัญชีสำเร็จ แต่ไม่สามารถบันทึกข้อมูลธุรกิจผู้จ้างงานได้ (โปรดรัน SQL Migration 004_fix_rls.sql ใน Supabase Editor)',
          },
        };
      }
      newOrg = { shelter: null, employer };
    }

    const profile = toProfile(data.user);
    setUser(profile);
    setOrg(newOrg);
    setLoading(false);
    return { user: data.user, error: null };
  };

  // ── signOut ───────────────────────────────────────────────────────────────
  const signOut = async () => {
    setLoading(true);
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setUser(null);
    setOrg(emptyOrg);
    setLoading(false);
  };

  return { user, org, loading, signIn, login: signIn, signUp, signOut };
};

export default useAuth;
export { useAuth };
