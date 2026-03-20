import { NavLink } from "react-router-dom";

const adminLinks = [
  {
    to: "/admin/analytics",
    label: "Dashboard",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          d="M4 20h16M7 16v-6m5 6V6m5 10v-3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    to: "/admin/analytics?tab=hotels",
    label: "Hotels",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          d="M3 21h18M3 7v14M21 7v14M3 7l9-4 9 4M5 21V11m4 10V11m6 10V11m4 10V11"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: "/admin/reports",
    label: "Reports",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          d="M6 4h9l3 3v13H6zM15 4v4h4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: "/admin/rooms",
    label: "Rooms",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          d="M3 11h18v8H3zm3-4h6v4H6zm9 2h3v2h-3z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: "/admin/bookings",
    label: "Bookings",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          d="M7 3v3m10-3v3M5 8h14v12H5zM5 12h14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    to: "/admin/customers",
    label: "Customers",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 1a2.5 2.5 0 1 0 0-5m-8 11H4a4 4 0 0 1 8 0Zm8 0h-5a4 4 0 0 1 2.7-3.8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: "/admin/payments",
    label: "Payments",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          d="M3 7h18v10H3zM3 11h18M7 15h2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: "/admin/reviews",
    label: "Reviews",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          d="m12 17-4.7 2.5.9-5.2L4.4 10l5.3-.8L12 4.5l2.3 4.7 5.3.8-3.8 4.3.9 5.2z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: "/admin/staff",
    label: "Staff",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 7a5.5 5.5 0 0 0-14 0m16-7-2 1m0 0-2-1m2 1V9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const linkClass = ({ isActive }) =>
  `admin-nav-link group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all duration-300 ${
    isActive
      ? "admin-nav-link-active bg-brand-ink text-white shadow-lg shadow-brand-ink/20 dark:bg-slate-700 dark:text-slate-50 dark:shadow-none"
      : "text-brand-ink/60 hover:bg-slate-50 hover:text-brand-ink dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
  }`;

function AdminSidebarLayout({ children }) {
  return (
    <div className="w-full bg-slate-50/50 dark:bg-slate-950/20 min-h-screen">
      {/* Horizontal Navbar */}
      <header className="sticky top-0 z-50 border-b border-brand-ink/5 bg-white/70 backdrop-blur-md dark:border-slate-700/30 dark:bg-slate-900/70">
        <div className="mx-auto max-w-[1600px] px-4 md:px-8 flex items-center justify-between h-20">
          <div className="flex items-center gap-8">
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight text-brand-ink dark:text-slate-100 lg:text-2xl">
                Admin <span className="text-brand-coral">Portal</span>
              </h2>
              <p className="hidden md:block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/40 dark:text-slate-400">
                Management Suite
              </p>
            </div>

            <nav className="hidden h-12 items-center gap-1 rounded-2xl bg-slate-100/50 p-1 dark:bg-slate-800/50 lg:flex">
              {adminLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className={linkClass}>
                  <span className="opacity-80 group-[.admin-nav-link-active]:text-white">
                    {link.icon}
                  </span>
                  <span className="whitespace-nowrap px-1">{link.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden border-l border-brand-ink/5 pl-4 dark:border-slate-700/30 sm:block">
              <div className="flex items-center gap-2 rounded-full bg-slate-100/50 px-3 py-1 dark:bg-slate-800/50">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)] animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 dark:text-slate-400">System Live</span>
              </div>
            </div>
            {/* User profile could go here */}
          </div>
        </div>
        
        {/* Mobile Navigation - Scrollable */}
        <nav className="lg:hidden flex items-center gap-2 overflow-x-auto p-3 bg-white/50 dark:bg-slate-800/20 scrollbar-hide border-t border-brand-ink/5 dark:border-slate-700/30">
          {adminLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              <span className="opacity-80 group-[.admin-nav-link-active]:text-white">
                {link.icon}
              </span>
              <span className="whitespace-nowrap text-xs">{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-[1600px] py-8 px-4 md:px-8">
        <div className="overflow-hidden rounded-3xl border border-brand-ink/5 bg-white/60 shadow-xl shadow-slate-200/50 dark:border-slate-700/50 dark:bg-slate-800/40 dark:shadow-none">
          {children}
        </div>
      </main>
    </div>
  );
}

export default AdminSidebarLayout;
