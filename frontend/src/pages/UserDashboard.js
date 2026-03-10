import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { cancelBooking, fetchUserBookings } from "../redux/slices/bookingSlice";

function UserDashboard() {
  const dispatch = useDispatch();
  const { bookings, loading } = useSelector((state) => state.bookings);
  const { user } = useSelector((state) => state.auth);
  const safeBookings = Array.isArray(bookings) ? bookings : [];

  if (user?.role === "admin") {
    return <Navigate to="/admin/analytics" replace />;
  }

  useEffect(() => {
    dispatch(fetchUserBookings());
  }, [dispatch]);

  return (
    <section className="container-pad py-10">
      <div className="grid gap-5 md:grid-cols-[250px,1fr]">
        <aside className="panel h-fit p-4">
          <h2 className="font-display text-2xl">My Space</h2>
          <p className="mt-1 text-sm text-brand-ink/75">
            {user?.name ? user.name : "Guest User"}
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="rounded-lg bg-white/70 px-3 py-2">My Bookings</div>
            <div className="rounded-lg bg-white/50 px-3 py-2 text-brand-ink/70">
              Profile
            </div>
            <div className="rounded-lg bg-white/50 px-3 py-2 text-brand-ink/70">
              Saved Hotels
            </div>
          </div>
        </aside>

        <div>
          <h1 className="font-display text-4xl">My Dashboard</h1>
          <p className="mt-1 text-brand-ink/75">
            Welcome back{user?.name ? `, ${user.name}` : ""}.
          </p>

          <div className="mt-6 panel p-5 md:p-6">
            <h2 className="mb-4 text-lg font-semibold">My Bookings</h2>
            {loading ? (
              <p>Loading bookings...</p>
            ) : safeBookings.length === 0 ? (
              <p className="text-brand-ink/75">No bookings found yet.</p>
            ) : (
              <div className="space-y-3">
                {safeBookings.map((booking) => (
                  <div
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-brand-ink/10 bg-white/70 p-4 md:flex-row md:items-center"
                    key={booking._id}
                  >
                    <div className="text-sm">
                      <p className="font-medium">
                        Hotel: {booking.hotel?.name || booking.hotel || "N/A"}
                      </p>
                      <p>Status: {booking.status || "pending"}</p>
                    </div>
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={() => dispatch(cancelBooking(booking._id))}
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default UserDashboard;
