import { useFormik } from "formik";
import * as Yup from "yup";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../redux/slices/authSlice";
import loginHero from "../assets/login-hero.png";

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, token, user } = useSelector((state) => state.auth);

  const dashboardRoute =
    user?.role === "admin" ? "/admin/analytics" : "/dashboard";

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email").required("Required"),
      password: Yup.string().required("Required"),
    }),
    onSubmit: async (values) => {
      const payload = { ...values, email: values.email.trim().toLowerCase() };
      const result = await dispatch(loginUser(payload));
      if (loginUser.fulfilled.match(result)) {
        const role = result.payload?.user?.role || "user";
        const defaultRoute = role === "admin" ? "/admin/analytics" : "/dashboard";
        navigate(location.state?.from || defaultRoute);
      }
    },
  });

  const styles = {
    page: {
      display: "flex",
      minHeight: "100vh",
      fontFamily: "'Segoe UI', sans-serif",
    },
    imageSide: {
      flex: 1,
      position: "relative",
      display: "none",
    },
    imageSideVisible: {
      flex: 1,
      position: "relative",
      display: "block",
    },
    heroImg: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: "center",
    },
    overlay: {
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(135deg, rgba(10,20,50,0.7) 0%, rgba(30,10,10,0.5) 100%)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      padding: "3rem",
    },
    overlayTag: {
      display: "inline-block",
      background: "rgba(255,100,60,0.85)",
      color: "#fff",
      fontSize: "0.75rem",
      fontWeight: 700,
      letterSpacing: "2px",
      textTransform: "uppercase",
      padding: "4px 12px",
      borderRadius: "20px",
      marginBottom: "1rem",
      width: "fit-content",
    },
    overlayTitle: {
      color: "#fff",
      fontSize: "2.4rem",
      fontWeight: 800,
      lineHeight: 1.2,
      margin: "0 0 0.75rem",
      textShadow: "0 2px 12px rgba(0,0,0,0.5)",
    },
    overlaySubtitle: {
      color: "rgba(255,255,255,0.8)",
      fontSize: "1rem",
      margin: 0,
      lineHeight: 1.6,
    },
    formSide: {
      width: "100%",
      maxWidth: "480px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      padding: "3rem 2.5rem",
      background: "#0d1b2a",
      overflowY: "auto",
    },
    logo: {
      fontSize: "1.5rem",
      fontWeight: 800,
      color: "#ff6b3d",
      marginBottom: "2.5rem",
      letterSpacing: "1px",
    },
    logoDot: { color: "#fff" },
    heading: {
      fontSize: "2rem",
      fontWeight: 800,
      color: "#fff",
      margin: "0 0 0.4rem",
    },
    subheading: {
      color: "rgba(255,255,255,0.55)",
      fontSize: "0.9rem",
      margin: "0 0 2rem",
    },
    label: {
      display: "block",
      fontSize: "0.82rem",
      fontWeight: 600,
      color: "rgba(255,255,255,0.7)",
      marginBottom: "0.4rem",
      letterSpacing: "0.5px",
    },
    input: {
      width: "100%",
      padding: "0.75rem 1rem",
      borderRadius: "10px",
      border: "1.5px solid rgba(255,255,255,0.1)",
      background: "rgba(255,255,255,0.06)",
      color: "#fff",
      fontSize: "0.95rem",
      outline: "none",
      boxSizing: "border-box",
      transition: "border-color 0.2s",
    },
    inputFocus: {
      borderColor: "#ff6b3d",
    },
    fieldGroup: { marginBottom: "1.2rem" },
    errorText: {
      color: "#ff6b6b",
      fontSize: "0.78rem",
      marginTop: "0.3rem",
    },
    submitBtn: {
      width: "100%",
      padding: "0.85rem",
      background: "linear-gradient(135deg, #ff6b3d 0%, #e84040 100%)",
      color: "#fff",
      border: "none",
      borderRadius: "10px",
      fontSize: "1rem",
      fontWeight: 700,
      cursor: "pointer",
      marginTop: "0.5rem",
      transition: "opacity 0.2s, transform 0.15s",
      letterSpacing: "0.5px",
    },
    errorBox: {
      marginTop: "1rem",
      padding: "0.75rem 1rem",
      borderRadius: "10px",
      background: "rgba(255,80,80,0.12)",
      border: "1px solid rgba(255,80,80,0.3)",
      color: "#ff9090",
      fontSize: "0.88rem",
    },
    footer: {
      marginTop: "1.5rem",
      color: "rgba(255,255,255,0.5)",
      fontSize: "0.88rem",
    },
    link: { color: "#ff6b3d", fontWeight: 700, textDecoration: "none" },
    alreadyBox: {
      textAlign: "center",
      color: "#fff",
    },
    alreadyBtn: {
      marginTop: "1.5rem",
      padding: "0.75rem 2rem",
      background: "linear-gradient(135deg, #ff6b3d, #e84040)",
      color: "#fff",
      border: "none",
      borderRadius: "10px",
      fontWeight: 700,
      cursor: "pointer",
      fontSize: "1rem",
    },
  };

  return (
    <div style={styles.page}>
      {/* Left: Hero Image */}
      <div style={{ flex: 1, position: "relative", minHeight: "100vh" }}
        className="login-hero-side">
        <img src={loginHero} alt="Luxury Hotel Lobby" style={styles.heroImg} />
        <div style={styles.overlay}>
          <span style={styles.overlayTag}>HotelHive</span>
          <h2 style={styles.overlayTitle}>
            Your Perfect Stay<br />Awaits You
          </h2>
          <p style={styles.overlaySubtitle}>
            Book luxurious hotels with ease.<br />
            Trusted by thousands of travellers.
          </p>
        </div>
      </div>

      {/* Right: Form */}
      <div style={styles.formSide}>
        <div style={styles.logo}>
          Hotel<span style={styles.logoDot}>Hive</span>
        </div>

        {token ? (
          <div style={styles.alreadyBox}>
            <h2 style={{ ...styles.heading, textAlign: "center" }}>
              Already Signed In
            </h2>
            <p style={{ color: "rgba(255,255,255,0.55)", marginTop: "0.5rem" }}>
              You are already logged in. Go to your dashboard.
            </p>
            <button
              style={styles.alreadyBtn}
              onClick={() => navigate(dashboardRoute)}
              type="button"
            >
              Open Dashboard
            </button>
          </div>
        ) : (
          <>
            <h1 style={styles.heading}>Welcome Back</h1>
            <p style={styles.subheading}>
              Login to continue your booking journey.
            </p>

            <form onSubmit={formik.handleSubmit}>
              <div style={styles.fieldGroup}>
                <label style={styles.label} htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  style={styles.input}
                  placeholder="you@example.com"
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  value={formik.values.email}
                />
                {formik.touched.email && formik.errors.email && (
                  <p style={styles.errorText}>{formik.errors.email}</p>
                )}
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label} htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  style={styles.input}
                  placeholder="••••••••"
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  value={formik.values.password}
                />
                {formik.touched.password && formik.errors.password && (
                  <p style={styles.errorText}>{formik.errors.password}</p>
                )}
              </div>

              <button
                style={{
                  ...styles.submitBtn,
                  opacity: loading ? 0.7 : 1,
                }}
                disabled={loading}
                type="submit"
              >
                {loading ? "Logging in..." : "Login →"}
              </button>

              {error && <div style={styles.errorBox}>{error}</div>}
            </form>

            <p style={styles.footer}>
              New user?{" "}
              <Link style={styles.link} to="/register">
                Create account
              </Link>
            </p>
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .login-hero-side { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default Login;
