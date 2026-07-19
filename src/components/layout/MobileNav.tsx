import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UsersRound, ClipboardList, PlusCircle, LogOut } from 'lucide-react';
import { useAuthContext } from '../../App';

const shelterNav = [
  { to: '/shelter/dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
  { to: '/shelter/residents', label: 'คนไร้บ้าน', icon: UsersRound },
  { to: '/shelter/matching', label: 'การจับคู่', icon: ClipboardList },
];

const employerNav = [
  { to: '/employer/dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
  { to: '/employer/create-job', label: 'ลงประกาศงาน', icon: PlusCircle },
  { to: '/employer/matches', label: 'เลือกผู้สมัคร', icon: ClipboardList },
];

const MobileNav: React.FC = () => {
  const { user, signOut } = useAuthContext();
  if (!user) return null;

  const navItems = user.role === 'shelter' ? shelterNav : employerNav;

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-md shadow-lg lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 py-1 text-center transition-all duration-150 active:scale-95 ${
                isActive
                  ? 'font-bold text-teal-700'
                  : 'font-medium text-slate-500 hover:text-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`flex h-8 w-12 items-center justify-center rounded-full transition-all duration-200 ${
                    isActive ? 'bg-teal-100/70 text-teal-700 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  <Icon size={19} />
                </div>
                <span className="text-[11px] leading-none tracking-tight">{label}</span>
              </>
            )}
          </NavLink>
        ))}

        <button
          type="button"
          onClick={() => signOut()}
          className="flex flex-1 flex-col items-center justify-center gap-1 py-1 text-center font-medium text-slate-400 hover:text-red-600 transition-colors active:scale-95"
          title="ออกจากระบบ"
        >
          <div className="flex h-8 w-12 items-center justify-center rounded-full hover:bg-red-50 hover:text-red-600 transition-all">
            <LogOut size={18} />
          </div>
          <span className="text-[11px] leading-none tracking-tight">ออกระบบ</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileNav;
