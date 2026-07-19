import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Building2, Home, LogIn, UserPlus, LogOut, ChevronDown, User } from 'lucide-react';
import { useAuthContext } from '../../App';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuthContext();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await signOut();
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150 ${
      isActive
        ? 'bg-white/15 text-white'
        : 'text-slate-300 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <nav
      className="border-b shadow-md"
      style={{
        background: 'linear-gradient(135deg, #0d2236 0%, #173A5E 60%, #1e4d7b 100%)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* ── Logo ── */}
        <Link to="/" className="flex items-center gap-3 text-white">
          {/* SVG logo on a soft translucent circle */}
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(4px)' }}
          >
            <img
              src="/pic/kaowmai-mark.svg"
              alt="ก้าวใหม่"
              className="h-6 w-6"
              style={{ filter: 'brightness(0) invert(1)' }}   /* white version on dark bg */
            />
          </span>
          <span>
            <span className="block text-xl font-extrabold leading-tight tracking-tight">ก้าวใหม่</span>
            <span className="block text-xs font-medium" style={{ color: '#93c5fd' }}>
              แพลตฟอร์มเชื่อมโอกาสการจ้างงาน
            </span>
          </span>
        </Link>

        {/* ── Right side ── */}
        <div className="flex items-center gap-1">
          {user ? (
            <>
              {user.role === 'shelter' ? (
                <NavLink to="/shelter/dashboard" className={linkClass}>
                  <Home size={15} aria-hidden />
                  ศูนย์คนไร้บ้าน
                </NavLink>
              ) : (
                <NavLink to="/employer/dashboard" className={linkClass}>
                  <Building2 size={15} aria-hidden />
                  ผู้จ้างงาน
                </NavLink>
              )}

              <div className="mx-2 h-5 w-px" style={{ background: 'rgba(255,255,255,0.15)' }} />

              {/* User dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: 'rgba(255,255,255,0.2)' }}
                  >
                    {user.displayName?.[0]?.toUpperCase() ?? <User size={14} />}
                  </span>
                  <span className="hidden sm:block max-w-[120px] truncate">{user.displayName}</span>
                  <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-slate-100 bg-white p-1 shadow-xl animate-fade-in">
                      <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.displayName}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        <span
                          className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold"
                          style={
                            user.role === 'shelter'
                              ? { background: '#ddeaf6', color: '#173A5E' }
                              : { background: '#ccfbf1', color: '#0d9488' }
                          }
                        >
                          {user.role === 'shelter' ? 'เจ้าหน้าที่ศูนย์' : 'ผู้จ้างงาน'}
                        </span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={15} />
                        ออกจากระบบ
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                <LogIn size={15} aria-hidden />
                เข้าสู่ระบบ
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150 shadow-md ${
                    isActive ? 'opacity-90' : 'hover:brightness-110'
                  }`
                }
                style={{ background: '#0d9488', color: '#fff' }}
              >
                <UserPlus size={15} aria-hidden />
                สมัครสมาชิก
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
