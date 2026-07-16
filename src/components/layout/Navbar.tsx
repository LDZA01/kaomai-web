import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { HeartHandshake, Building2, Home, LogIn, UserPlus, LogOut, ChevronDown, User } from 'lucide-react';
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
        ? 'bg-white/20 text-white shadow-inner'
        : 'text-blue-100 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <nav className="border-b border-blue-900/50 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 shadow-lg shadow-blue-900/20">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md shadow-emerald-900/30">
            <HeartHandshake size={22} aria-hidden />
          </span>
          <span>
            <span className="block text-xl font-extrabold leading-tight tracking-tight">ก้าวใหม่</span>
            <span className="block text-xs font-medium text-blue-300">แพลตฟอร์มเชื่อมโอกาสการจ้างงาน</span>
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-1">
          {user ? (
            /* ── Logged-in state ── */
            <>
              {/* Role tab */}
              {user.role === 'shelter' ? (
                <NavLink to="/shelter/dashboard" className={linkClass}>
                  <Home size={15} aria-hidden />
                  ศูนย์พักพิง
                </NavLink>
              ) : (
                <NavLink to="/employer/dashboard" className={linkClass}>
                  <Building2 size={15} aria-hidden />
                  ผู้จ้างงาน
                </NavLink>
              )}

              <div className="mx-2 h-5 w-px bg-blue-700" />

              {/* User dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-blue-100 transition hover:bg-white/10 hover:text-white"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                    {user.displayName?.[0]?.toUpperCase() ?? <User size={14} />}
                  </span>
                  <span className="hidden sm:block max-w-[120px] truncate">{user.displayName}</span>
                  <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                    {/* Dropdown */}
                    <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-slate-100 bg-white p-1 shadow-xl shadow-slate-200/60 animate-fade-in">
                      <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.displayName}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                          user.role === 'shelter'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
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
            /* ── Guest state ── */
            <>
              <NavLink to="/login" className={linkClass}>
                <LogIn size={15} aria-hidden />
                เข้าสู่ระบบ
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-400 text-blue-950'
                      : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-md shadow-emerald-900/30'
                  }`
                }
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
