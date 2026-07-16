import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { HeartHandshake, Building2, Home, LogIn, UserPlus } from 'lucide-react';

const Navbar: React.FC = () => {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150 ${
      isActive
        ? 'bg-white/20 text-white shadow-inner'
        : 'text-blue-100 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <nav className="border-b border-blue-900/50 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 shadow-lg shadow-blue-900/20">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/" className="flex items-center gap-3 text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md shadow-emerald-900/30">
            <HeartHandshake size={22} aria-hidden />
          </span>
          <span>
            <span className="block text-xl font-extrabold leading-tight tracking-tight">ก้าวใหม่</span>
            <span className="block text-xs font-medium text-blue-300">แพลตฟอร์มเชื่อมโอกาสการจ้างงาน</span>
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-1">
          <NavLink to="/shelter/dashboard" className={linkClass}>
            <Home size={15} aria-hidden />
            ศูนย์พักพิง
          </NavLink>
          <NavLink to="/employer/dashboard" className={linkClass}>
            <Building2 size={15} aria-hidden />
            ผู้จ้างงาน
          </NavLink>
          <div className="mx-1 h-5 w-px bg-blue-700" />
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
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
