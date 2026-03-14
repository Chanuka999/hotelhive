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
  `group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-brand-ink text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
      : "text-brand-ink/80 hover:bg-brand-ink/10 hover:text-brand-ink dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-50"
  }`;

function AdminSidebarLayout({ children }) {
  return (
    <div className="w-full py-6">
      <div className="grid gap-4 lg:grid-cols-[290px,minmax(0,1fr)] lg:items-start lg:gap-6">
        <aside className="panel flex flex-col lg:sticky lg:top-20 lg:min-h-[calc(100vh-6.5rem)]">
          <div className="border-b border-brand-ink/10 px-4 py-4 dark:border-slate-700">
            <h2 className="font-display text-2xl">Admin Panel</h2>
            <p className="text-xs text-brand-ink/65 dark:text-slate-300">
              Management navigation
            </p>
          </div>
          <nav className="grid auto-cols-[minmax(140px,1fr)] grid-flow-col gap-2 overflow-x-auto p-3 lg:flex-1 lg:grid-flow-row lg:auto-cols-auto lg:overflow-x-visible lg:overflow-y-auto">
            {adminLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClass}>
                <span className="opacity-85 transition-opacity group-hover:opacity-100">
                  {link.icon}
                </span>
                <span className="whitespace-nowrap">{link.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 px-4 md:px-6 lg:pr-6">{children}</div>
      </div>
    </div>
  );
}

export default AdminSidebarLayout;
