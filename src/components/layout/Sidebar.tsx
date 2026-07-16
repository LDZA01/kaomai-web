import React from 'react';
import { NavLink } from 'react-router-dom';
import { ClipboardList, LayoutDashboard, PlusCircle, UsersRound, Building2, Home } from 'lucide-react';
import { useAuthContext } from '../../App';

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
  const { user } = useAuthContext();

  // ซ่อน sidebar เมื่อยังไม่ได้ login
  if (!user) return null;

  const links = user.role === 'shelter' ? shelterLinks : employerLinks;
  const isShelter = user.role === 'shelter';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 ${
      isActive
        ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 shadow-sm border border-blue-100'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`;

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-100 bg-white p-4 lg:block min-h-[calc(100vh-57px)]">
      <nav>
        <div className="mb-2 flex items-center gap-2 px-1">
          {isShelter ? (
            <Home size={13} className="text-slate-400" aria-hidden />
          ) : (
            <Building2 size={13} className="text-slate-400" aria-hidden />
          )}
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {isShelter ? 'ศูนย์พักพิง' : 'ผู้จ้างงาน'}
          </p>
        </div>
        <div className="space-y-0.5">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon size={17} aria-hidden />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
