import { useFormik } from "formik";
import * as Yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../redux/slices/authSlice";

function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "user",
    },
    validationSchema: Yup.object({
      name: Yup.string().min(2, "Too short").required("Required"),
      email: Yup.string().email("Invalid email").required("Required"),
      password: Yup.string()
        .min(6, "At least 6 characters")
        .required("Required"),
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

  return (
    <section className="container-pad py-10">
      <div className="mx-auto max-w-lg panel p-6 md:p-8">
        <h1 className="font-display text-4xl">Create Account</h1>
        <p className="mt-1 text-sm text-brand-ink/75">
          Join HotelHive to manage bookings in one place.
        </p>

        <form className="mt-6 space-y-4" onSubmit={formik.handleSubmit}>
          <input
            id="name"
            name="name"
            placeholder="Full Name"
            className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
            value={formik.values.name}
          />
          <input
            id="email"
            name="email"
            placeholder="Email"
            type="email"
            className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
            value={formik.values.email}
          />
          <input
            id="phone"
            name="phone"
            placeholder="Phone (optional)"
            className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
            value={formik.values.phone}
          />
          <select
            id="role"
            name="role"
            className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
            value={formik.values.role}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <input
            id="password"
            name="password"
            placeholder="Password"
            type="password"
            className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
            value={formik.values.password}
          />

          <button
            className="btn-primary w-full"
            disabled={loading}
            type="submit"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-sm text-brand-ink/80">
          Already have an account?{" "}
          <Link className="font-semibold text-brand-coral" to="/login">
            Login
          </Link>
        </p>
      </div>
    </section>
  );
}

export default Register;
