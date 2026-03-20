import { useFormik } from "formik";
import * as Yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../redux/slices/authSlice";
import registerHero from "../assets/register-hero.png";

function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const formik = useFormik({
    initialValues: { name: "", email: "", password: "", phone: "", role: "user" },
    validationSchema: Yup.object({
      name: Yup.string().min(2, "Too short").required("Required"),
      email: Yup.string().email("Invalid email").required("Required"),
      password: Yup.string().min(6, "At least 6 characters").required("Required"),
      phone: Yup.string().optional(),
      role: Yup.string().oneOf(["user", "admin"]).required("Required"),
    }),
    onSubmit: async (values) => {
      const result = await dispatch(registerUser(values));
      if (registerUser.fulfilled.match(result)) {
        const role = result.payload?.user?.role || values.role || "user";
        navigate(role === "admin" ? "/admin/analytics" : "/dashboard");
      }
    },
  });

  const styles = {
    page: {
      display: "flex",
      minHeight: "100vh",
      fontFamily: "'Segoe UI', sans-serif",
    },
    formSide: {
      width: "100%",
      maxWidth: "500px",
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
      marginBottom: "2rem",
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
      margin: "0 0 1.8rem",
    },
    row: {
      display: "flex",
      gap: "1rem",
    },
    fieldGroup: { marginBottom: "1rem", flex: 1 },
    fieldGroupFull: { marginBottom: "1rem" },
    label: {
      display: "block",
      fontSize: "0.82rem",
      fontWeight: 600,
      color: "rgba(255,255,255,0.7)",
      marginBottom: "0.35rem",
      letterSpacing: "0.5px",
    },
    input: {
      width: "100%",
      padding: "0.7rem 1rem",
      borderRadius: "10px",
      border: "1.5px solid rgba(255,255,255,0.1)",
      background: "rgba(255,255,255,0.06)",
      color: "#fff",
      fontSize: "0.9rem",
      outline: "none",
      boxSizing: "border-box",
      transition: "border-color 0.2s",
    },
    select: {
      width: "100%",
      padding: "0.7rem 1rem",
      borderRadius: "10px",
      border: "1.5px solid rgba(255,255,255,0.1)",
      background: "#1a2a3a",
      color: "#fff",
      fontSize: "0.9rem",
      outline: "none",
      boxSizing: "border-box",
      cursor: "pointer",
    },
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
      marginTop: "0.75rem",
      letterSpacing: "0.5px",
      transition: "opacity 0.2s",
    },
    footer: {
      marginTop: "1.25rem",
      color: "rgba(255,255,255,0.5)",
      fontSize: "0.88rem",
    },
    link: { color: "#ff6b3d", fontWeight: 700, textDecoration: "none" },
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
        "linear-gradient(135deg, rgba(10,30,60,0.65) 0%, rgba(50,10,10,0.55) 100%)",
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
  };

  return (
    <div style={styles.page}>
      {/* Left: Form */}
      <div style={styles.formSide}>
        <div style={styles.logo}>
          Hotel<span style={styles.logoDot}>Hive</span>
        </div>

        <h1 style={styles.heading}>Create Account</h1>
        <p style={styles.subheading}>
          Join HotelHive to manage your bookings in one place.
        </p>

        <form onSubmit={formik.handleSubmit}>
          {/* Name + Phone Row */}
          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                placeholder="John Doe"
                style={styles.input}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
                value={formik.values.name}
              />
              {formik.touched.name && formik.errors.name && (
                <p style={styles.errorText}>{formik.errors.name}</p>
              )}
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="phone">Phone</label>
              <input
                id="phone"
                name="phone"
                placeholder="+94 77 xxx xxxx"
                style={styles.input}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
                value={formik.values.phone}
              />
            </div>
          </div>

          {/* Email */}
          <div style={styles.fieldGroupFull}>
            <label style={styles.label} htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              style={styles.input}
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              value={formik.values.email}
            />
            {formik.touched.email && formik.errors.email && (
              <p style={styles.errorText}>{formik.errors.email}</p>
            )}
          </div>

          {/* Password + Role Row */}
          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                style={styles.input}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
                value={formik.values.password}
              />
              {formik.touched.password && formik.errors.password && (
                <p style={styles.errorText}>{formik.errors.password}</p>
              )}
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="role">Account Type</label>
              <select
                id="role"
                name="role"
                style={styles.select}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
                value={formik.values.role}
              >
                <option value="user">Guest / User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <button
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
            type="submit"
          >
            {loading ? "Creating account..." : "Create Account →"}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link style={styles.link} to="/login">
            Login
          </Link>
        </p>
      </div>

      {/* Right: Hero Image */}
      <div
        style={{ flex: 1, position: "relative", minHeight: "100vh" }}
        className="register-hero-side"
      >
        <img src={registerHero} alt="Luxury Hotel Pool" style={styles.heroImg} />
        <div style={styles.overlay}>
          <span style={styles.overlayTag}>Join Us Today</span>
          <h2 style={styles.overlayTitle}>
            Discover<br />Luxury Living
          </h2>
          <p style={styles.overlaySubtitle}>
            Access exclusive deals and manage<br />
            your hotel bookings effortlessly.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .register-hero-side { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default Register;
