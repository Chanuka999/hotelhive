import { useFormik } from "formik";
import * as Yup from "yup";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../redux/slices/authSlice";

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading } = useSelector((state) => state.auth);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email").required("Required"),
      password: Yup.string().required("Required"),
    }),
    onSubmit: async (values) => {
      const payload = {
        ...values,
        email: values.email.trim().toLowerCase(),
      };

      const result = await dispatch(loginUser(payload));
      if (loginUser.fulfilled.match(result)) {
        const role = result.payload?.user?.role || "user";
        const defaultRoute =
          role === "admin" ? "/admin/analytics" : "/dashboard";
        navigate(location.state?.from || defaultRoute);
      }
    },
  });

  return (
    <section className="container-pad py-10">
      <div className="mx-auto max-w-lg panel p-6 md:p-8">
        <h1 className="font-display text-4xl">Welcome Back</h1>
        <p className="mt-1 text-sm text-brand-ink/75">
          Login to continue your booking journey.
        </p>

        <form className="mt-6 space-y-4" onSubmit={formik.handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              value={formik.values.email}
            />
            {formik.touched.email && formik.errors.email && (
              <p className="mt-1 text-xs text-red-600">{formik.errors.email}</p>
            )}
          </div>

          <div>
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              value={formik.values.password}
            />
            {formik.touched.password && formik.errors.password && (
              <p className="mt-1 text-xs text-red-600">
                {formik.errors.password}
              </p>
            )}
          </div>

          <button
            className="btn-primary w-full"
            disabled={loading}
            type="submit"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-sm text-brand-ink/80">
          New user?{" "}
          <Link className="font-semibold text-brand-coral" to="/register">
            Create account
          </Link>
        </p>
      </div>
    </section>
  );
}

export default Login;
