import React from 'react';
import { NavLink } from 'react-router-dom';
import { ClipboardList, LayoutDashboard, PlusCircle, UsersRound, Building2, Home } from 'lucide-react';

const shelterLinks = [
  { to: '/shelter/dashboard', label: 'ภาพรวมศูนย์', icon: LayoutDashboard },
  { to: '/shelter/residents', label: 'จัดการผู้พักพิง', icon: UsersRound },
  { to: '/shelter/matching', label: 'ติดตามการจับคู่', icon: ClipboardList },
];

const employerLinks = [
  { to: '/employer/dashboard', label: 'ภาพรวมผู้จ้างงาน', icon: LayoutDashboard },
  { to: '/employer/create-job', label: 'ลงประกาศงาน', icon: PlusCircle },
  { to: '/employer/matches', label: 'เลือกผู้สมัคร', icon: ClipboardList },
];

const Sidebar: React.FC = () => {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 ${
      isActive
        ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 shadow-sm border border-blue-100'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`;

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-100 bg-white p-4 lg:block min-h-[calc(100vh-65px)]">
      <nav className="space-y-5">
        <div>
          <div className="mb-2 flex items-center gap-2 px-1">
            <Home size={13} className="text-slate-400" aria-hidden />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">ศูนย์พักพิง</p>
          </div>
          <div className="space-y-0.5">
            {shelterLinks.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={linkClass}>
                <Icon size={17} aria-hidden />
                {label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        <div>
          <div className="mb-2 flex items-center gap-2 px-1">
            <Building2 size={13} className="text-slate-400" aria-hidden />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">ผู้จ้างงาน</p>
          </div>
          <div className="space-y-0.5">
            {employerLinks.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={linkClass}>
                <Icon size={17} aria-hidden />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
