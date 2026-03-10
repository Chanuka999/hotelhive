import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/slices/authSlice";

const navClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-brand-ink text-white"
      : "text-brand-ink/80 hover:bg-brand-ink/10"
  }`;

function Navbar() {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  return (
    <header className="sticky top-0 z-30 border-b border-brand-ink/10 bg-brand-sand/85 backdrop-blur">
      <div className="container-pad flex items-center justify-between py-3">
        <Link to="/" className="font-display text-2xl font-bold text-brand-ink">
          Hotel<span className="text-brand-coral">Hive</span>
        </Link>

        <button
          className="btn-secondary md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          type="button"
        >
          Menu
        </button>

        <nav className="hidden items-center gap-2 md:flex">
          <NavLink to="/" className={navClass}>
            Home
          </NavLink>
          <NavLink to="/hotels" className={navClass}>
            Hotels
          </NavLink>
          {user ? (
            <>
              <NavLink to="/dashboard" className={navClass}>
                Dashboard
              </NavLink>
              {user?.role === "admin" && (
                <NavLink to="/admin/analytics" className={navClass}>
                  Analytics
                </NavLink>
              )}
              <button
                className="btn-primary"
                onClick={() => dispatch(logout())}
                type="button"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navClass}>
                Login
              </NavLink>
              <Link to="/register" className="btn-primary">
                Join Now
              </Link>
            </>
          )}
        </nav>
      </div>

      {open && (
        <div className="container-pad pb-3 md:hidden">
          <div className="panel grid gap-2 p-3">
            <NavLink to="/" className={navClass} onClick={() => setOpen(false)}>
              Home
            </NavLink>
            <NavLink
              to="/hotels"
              className={navClass}
              onClick={() => setOpen(false)}
            >
              Hotels
            </NavLink>
            {user ? (
              <>
                <NavLink
                  to="/dashboard"
                  className={navClass}
                  onClick={() => setOpen(false)}
                >
                  Dashboard
                </NavLink>
                {user?.role === "admin" && (
                  <NavLink
                    to="/admin/analytics"
                    className={navClass}
                    onClick={() => setOpen(false)}
                  >
                    Analytics
                  </NavLink>
                )}
                <button
                  className="btn-primary"
                  onClick={() => {
                    dispatch(logout());
                    setOpen(false);
                  }}
                  type="button"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={navClass}
                  onClick={() => setOpen(false)}
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className="btn-primary text-center"
                  onClick={() => setOpen(false)}
                >
                  Join Now
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
