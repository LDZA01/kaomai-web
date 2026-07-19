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
      className="sticky top-0 z-30 border-b shadow-sm"
      style={{
        background: 'linear-gradient(135deg, #0d2236 0%, #173A5E 60%, #1e4d7b 100%)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3">
        {/* ── Logo & Brand ── */}
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 text-white">
          <span
            className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl shadow-inner"
            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(4px)' }}
          >
            <img
              src="/pic/kaowmai-mark.svg"
              alt="ก้าวใหม่"
              className="h-5 w-5 sm:h-6 sm:w-6"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </span>
          <span className="flex flex-col">
            <span className="text-lg sm:text-xl font-extrabold leading-tight tracking-tight">kaowmai</span>
            <span className="hidden xs:block text-[11px] sm:text-xs font-medium" style={{ color: '#93c5fd' }}>
              แพลตฟอร์มเชื่อมโอกาสการจ้างงาน
            </span>
          </span>
        </Link>

        {/* ── Right side ── */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {user ? (
            <>
              {/* Desktop quick links */}
              <div className="hidden lg:flex items-center gap-1">
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
              </div>

              <div className="hidden lg:block mx-1 h-5 w-px" style={{ background: 'rgba(255,255,255,0.15)' }} />

              {/* User profile dropdown button */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white active:scale-95"
                >
                  <span
                    className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ring-1 ring-white/20"
                    style={{ background: 'rgba(255,255,255,0.2)' }}
                  >
                    {user.displayName?.[0]?.toUpperCase() ?? <User size={14} />}
                  </span>
                  <span className="hidden sm:inline max-w-[130px] truncate">{user.displayName}</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute right-0 top-full z-20 mt-2 w-60 rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl animate-fade-in">
                      <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                        <p className="text-sm font-bold text-slate-900 truncate">{user.displayName}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        <span
                          className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                          style={
                            user.role === 'shelter'
                              ? { background: '#ddeaf6', color: '#173A5E' }
                              : { background: '#ccfbf1', color: '#0d9488' }
                          }
                        >
                          {user.role === 'shelter' ? 'เจ้าหน้าที่ศูนย์คนไร้บ้าน' : 'ผู้จ้างงาน'}
                        </span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={16} />
                        ออกจากระบบ
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <NavLink to="/login" className={linkClass}>
                <LogIn size={15} aria-hidden />
                <span className="hidden xs:inline">เข้าสู่ระบบ</span>
                <span className="xs:hidden">เข้าเรียน</span>
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold transition-all duration-150 shadow-sm ${
                    isActive ? 'opacity-90' : 'hover:brightness-110 active:scale-95'
                  }`
                }
                style={{ background: '#0d9488', color: '#fff' }}
              >
                <UserPlus size={15} aria-hidden />
                <span>สมัครสมาชิก</span>
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
