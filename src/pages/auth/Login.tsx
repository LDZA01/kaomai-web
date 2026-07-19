import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Home, Building2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuthContext } from '../../App';

const DEMO_ACCOUNTS = [
  {
    role: 'shelter' as const,
    label: 'ศูนย์คนไร้บ้าน',
    email: 'shelter.demo@kaowmai.th',
    password: 'password',
    icon: Home,
    color: '#173A5E',
    bg: '#f0f6fc',
    border: '#ddeaf6',
  },
  {
    role: 'employer' as const,
    label: 'ผู้จ้างงาน',
    email: 'employer.demo@kaowmai.th',
    password: 'password',
    icon: Building2,
    color: '#0d9488',
    bg: '#f0fdfa',
    border: '#ccfbf1',
  },
];

const Login = () => {
  const { login } = useAuthContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [filled, setFilled] = useState<'shelter' | 'employer' | null>(null);

  const fillDemo = (account: typeof DEMO_ACCOUNTS[number]) => {
    setEmail(account.email);
    setPassword(account.password);
    setFilled(account.role);
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const { user, error: authError } = await login(email, password);
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const redirectTo = (user as { role?: string })?.role === 'employer'
      ? '/employer/dashboard'
      : '/shelter/dashboard';
    navigate(redirectTo);
  };

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center py-10 animate-fade-in">
      {/* Logo & Branding */}
      <div className="mb-8 text-center">
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
          style={{ background: 'linear-gradient(135deg, #173A5E, #1e4d7b)', boxShadow: '0 8px 24px rgba(23,58,94,0.25)' }}
        >
          <img
            src="/pic/kaowmai-mark.svg"
            alt="ก้าวใหม่"
            className="h-9 w-9"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>
        <h1 className="text-2xl font-extrabold" style={{ color: '#173A5E' }}>เข้าสู่ระบบ</h1>
        <p className="mt-1 text-sm text-slate-500">แพลตฟอร์มก้าวใหม่ — เชื่อมโอกาสสู่ชีวิตที่ดีกว่า</p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-lg shadow-slate-100/80">
        {/* Quick-fill demo cards */}
        <div className="mb-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
            บัญชีทดสอบ — กดเพื่อเติมอัตโนมัติ
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((account) => {
              const Icon = account.icon;
              const isActive = filled === account.role;
              return (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => fillDemo(account)}
                  className="flex flex-col items-start gap-1.5 rounded-xl border-2 p-3 text-left transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
                  style={{
                    background: account.bg,
                    borderColor: isActive ? account.color : account.border,
                    boxShadow: isActive ? `0 0 0 2px ${account.color}22` : 'none',
                  }}
                >
                  <div className="flex w-full items-center gap-1.5">
                    <Icon size={14} style={{ color: account.color }} />
                    <span className="text-xs font-bold" style={{ color: account.color }}>
                      {account.label}
                    </span>
                    {isActive && (
                      <span
                        className="ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                        style={{ background: account.color }}
                      >
                        ✓ เติมแล้ว
                      </span>
                    )}
                  </div>
                  <span className="w-full truncate font-mono text-[11px] text-slate-500">
                    {account.email}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-center text-[11px] text-slate-400">
            รหัสผ่านทั้งคู่: <span className="font-mono font-bold text-slate-600">password</span>
          </p>
        </div>

        <div className="mb-4 h-px bg-slate-100" />

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-700">
            <span>⚠</span> {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-1">
          <Input 
            label="อีเมล" 
            type="email" 
            value={email} 
            onChange={(e) => { setEmail(e.target.value); setFilled(null); }} 
            required 
            placeholder="your@email.com" 
          />
          <Input 
            label="รหัสผ่าน" 
            type="password" 
            value={password} 
            onChange={(e) => { setPassword(e.target.value); setFilled(null); }} 
            required 
            placeholder="••••••••" 
          />
          <div className="pt-2">
            <Button type="submit" className="w-full" disabled={loading}>
              <LogIn size={18} aria-hidden />
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
