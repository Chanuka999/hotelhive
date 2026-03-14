import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/slices/authSlice";

function ThemeIcon({ isDark }) {
  if (isDark) {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 4.75V3m0 18v-1.75M6.34 6.34 5.1 5.1m13.8 13.8-1.24-1.24M4.75 12H3m18 0h-1.75M6.34 17.66 5.1 18.9m13.8-13.8-1.24 1.24M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20.4 14.5A8.5 8.5 0 1 1 9.5 3.6a7.1 7.1 0 1 0 10.9 10.9Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function Navbar({ isDark, onToggleTheme }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const nextThemeLabel = isDark
    ? "Switch to light mode"
    : "Switch to dark mode";

  return (
    <header
      className={`sticky top-0 z-30 border-b backdrop-blur transition-colors ${
        isDark
          ? "border-slate-700/60 bg-slate-950/85"
          : "border-brand-ink/10 bg-brand-sand/85"
      }`}
    >
      <div className="container-pad flex items-center justify-between py-3">
        <Link
          to="/"
          className={`font-display text-2xl font-bold ${
            isDark ? "text-slate-100" : "text-brand-ink"
          }`}
        >
          Hotel
          <span className={isDark ? "text-orange-300" : "text-brand-coral"}>
            Hive
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <button
            className="btn-secondary"
            onClick={onToggleTheme}
            type="button"
            aria-label={nextThemeLabel}
            title={nextThemeLabel}
          >
            <ThemeIcon isDark={isDark} />
          </button>

          {token ? (
            <button
              className="btn-primary"
              onClick={handleLogout}
              type="button"
            >
              Logout
            </button>
          ) : (
            <Link to="/login" className="btn-primary">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
