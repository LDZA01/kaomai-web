import React from 'react';
import { NavLink } from 'react-router-dom';
import { ClipboardList, LayoutDashboard, PlusCircle, UsersRound, Building2, Home } from 'lucide-react';
import { useAuthContext } from '../../App';

const shelterLinks = [
  { to: '/shelter/dashboard', label: 'ภาพรวมศูนย์',      icon: LayoutDashboard },
  { to: '/shelter/residents', label: 'จัดการคนไร้บ้าน',   icon: UsersRound },
  { to: '/shelter/matching',  label: 'ติดตามการจับคู่',   icon: ClipboardList },
];

const employerLinks = [
  { to: '/employer/dashboard',  label: 'ภาพรวมผู้จ้างงาน', icon: LayoutDashboard },
  { to: '/employer/create-job', label: 'ลงประกาศงาน',       icon: PlusCircle },
  { to: '/employer/matches',    label: 'เลือกผู้สมัคร',     icon: ClipboardList },
];

const Sidebar: React.FC = () => {
  const { user } = useAuthContext();
  if (!user) return null;

  const links    = user.role === 'shelter' ? shelterLinks : employerLinks;
  const isShelter = user.role === 'shelter';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 ${
      isActive
        ? 'text-white shadow-sm'
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
    }`;

  return (
    <aside
      className="hidden w-60 shrink-0 border-r border-slate-100 bg-white p-4 lg:block"
      style={{ minHeight: 'calc(100vh - 57px)' }}
    >
      <nav>
        <div className="mb-2 flex items-center gap-2 px-1">
          {isShelter
            ? <Home    size={12} className="text-slate-400" aria-hidden />
            : <Building2 size={12} className="text-slate-400" aria-hidden />}
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {isShelter ? 'ศูนย์คนไร้บ้าน' : 'ผู้จ้างงาน'}
          </p>
        </div>

        <div className="space-y-0.5">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={linkClass}
              style={({ isActive }) =>
                isActive
                  ? { background: 'linear-gradient(135deg, #173A5E, #1e4d7b)' }
                  : {}
              }
            >
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
