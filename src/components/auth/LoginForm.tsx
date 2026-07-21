'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Home, LogIn } from 'lucide-react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';

const demos = [
  { role: 'shelter', label: 'ศูนย์คนไร้บ้าน', email: 'shelter.demo@kaowmai.th', icon: Home },
  { role: 'employer', label: 'ผู้จ้างงาน', email: 'employer.demo@kaowmai.th', icon: Building2 },
] as const;

export function LoginForm() {
  const { login } = useAuthContext();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const r = await login(email, password);
    if (r.error) {
      setError(r.error.message);
      setBusy(false);
      return;
    }
    const userObj = r.user as { role?: string; user_metadata?: { role?: string } } | null;
    const metadataRole = userObj?.user_metadata?.role;
    const userRole = metadataRole || (email.includes('employer') ? 'employer' : 'shelter');
    router.push(`/${userRole}/dashboard`);
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          บัญชีทดสอบ — กดเพื่อเติมอัตโนมัติ
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {demos.map(({ role, label, email: demo, icon: Icon }) => (
            <button
              type="button"
              key={role}
              onClick={() => {
                setEmail(demo);
                setPassword('password');
                setError('');
              }}
              className="flex min-h-[5rem] items-center gap-3 rounded-[14px] border border-slate-200 p-3 text-left transition hover:border-brand-300 hover:bg-brand-50 active:scale-95"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] bg-brand-100 text-brand-700">
                <Icon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <b className="block text-sm text-slate-950 truncate">{label}</b>
                <span className="block truncate text-xs text-slate-500 font-mono">{demo}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">
          รหัสผ่านทั้งคู่: <span className="font-mono font-bold text-slate-700">password</span>
        </p>
      </div>

      <Field
        name="email"
        label="อีเมล"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
      />
      <Field
        name="password"
        label="รหัสผ่าน"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={error}
      />
      <Button type="submit" size="lg" disabled={busy}>
        <LogIn size={18} />
        {busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
      </Button>
      <p className="text-center text-sm text-slate-700">
        ยังไม่มีบัญชี?{' '}
        <Link className="font-bold text-brand-700 underline" href="/register">
          สมัครใช้งาน
        </Link>
      </p>
    </form>
  );
}
