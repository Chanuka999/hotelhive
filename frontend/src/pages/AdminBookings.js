import { useEffect, useMemo, useState } from "react";
import bookingService from "../services/bookingService";
import { formatDate, toCurrency } from "../utils/format";

const statusOptions = ["pending", "confirmed", "cancelled", "completed"];

function StatusBadge({ status }) {
  const classes = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
    completed: "bg-sky-100 text-sky-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        classes[status] ||
        "bg-brand-ink/10 text-brand-ink dark:bg-slate-700/70 dark:text-slate-100"
      }`}
    >
      {status}
    </span>
  );
}

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusDrafts, setStatusDrafts] = useState({});

  const loadBookings = async () => {
    try {
      setLoading(true);
      const rows = await bookingService.getAllBookingsAdmin();
      setBookings(Array.isArray(rows) ? rows : []);
      setStatusDrafts(
        (Array.isArray(rows) ? rows : []).reduce((acc, booking) => {
          acc[booking._id] = booking.status;
          return acc;
        }, {}),
      );
    } catch (error) {
      setMessage(error?.response?.data?.error || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    if (statusFilter === "all") {
      return bookings;
    }

    return bookings.filter((booking) => booking.status === statusFilter);
  }, [bookings, statusFilter]);

  const patchBookingLocally = (bookingId, updater) => {
    setBookings((current) =>
      current.map((item) =>
        item._id === bookingId
          ? {
              ...item,
              ...updater,
            }
          : item,
      ),
    );
  };

  const approveBooking = async (bookingId) => {
    setMessage("");
    try {
      const updated = await bookingService.approveBooking(bookingId);
      patchBookingLocally(bookingId, updated);
      setStatusDrafts((current) => ({
        ...current,
        [bookingId]: updated.status,
      }));
      setMessage("Booking approved");
    } catch (error) {
      setMessage(error?.response?.data?.error || "Failed to approve booking");
    }
  };

  const cancelBooking = async (bookingId) => {
    const reason = window.prompt(
      "Cancellation reason (optional):",
      "Cancelled by admin",
    );

    setMessage("");
    try {
      const updated = await bookingService.updateBookingStatus(
        bookingId,
        "cancelled",
        reason || "Cancelled by admin",
      );
      patchBookingLocally(bookingId, updated);
      setStatusDrafts((current) => ({
        ...current,
        [bookingId]: updated.status,
      }));
      setMessage("Booking cancelled");
    } catch (error) {
      setMessage(error?.response?.data?.error || "Failed to cancel booking");
    }
  };

  const saveStatus = async (bookingId) => {
    const nextStatus = statusDrafts[bookingId];
    if (!nextStatus) {
      return;
    }

    setMessage("");
    try {
      const updated = await bookingService.updateBookingStatus(
        bookingId,
        nextStatus,
      );
      patchBookingLocally(bookingId, updated);
      setMessage("Booking status updated");
    } catch (error) {
      setMessage(error?.response?.data?.error || "Failed to update status");
    }
  };

  return (
    <section className="container-pad py-10">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-4xl">Admin Booking Management</h1>
          <p className="text-brand-ink/75">
            View all bookings, approve requests, cancel reservations, and update
            status.
          </p>
        </div>

        <div className="w-full max-w-xs">
          <label className="mb-1 block text-sm font-medium">
            Filter status
          </label>
          <select
            className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
            onChange={(event) => setStatusFilter(event.target.value)}
            value={statusFilter}
          >
            <option value="all">All</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {message ? (
        <div className="mb-4 rounded-2xl border border-brand-ink/10 bg-white/80 px-4 py-3 text-sm">
          {message}
        </div>
      ) : null}

      <div className="panel p-5 md:p-6">
        {loading ? (
          <p className="text-sm text-brand-ink/70">Loading bookings...</p>
        ) : filteredBookings.length === 0 ? (
          <p className="text-sm text-brand-ink/70">No bookings found.</p>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <article
                key={booking._id}
                className="rounded-2xl border border-brand-ink/10 bg-white/70 p-4"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    {booking.hotel?.name || "Unknown Hotel"}
                  </p>
                  <StatusBadge status={booking.status || "pending"} />
                </div>

                <div className="grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-4">
                  <p>User: {booking.user?.name || "N/A"}</p>
                  <p>Email: {booking.user?.email || "N/A"}</p>
                  <p>Room: {booking.room?.roomType || "N/A"}</p>
                  <p>Rooms count: {booking.numberOfRooms || 1}</p>
                  <p>Check-in: {formatDate(booking.checkIn)}</p>
                  <p>Check-out: {formatDate(booking.checkOut)}</p>
                  <p>Total: {toCurrency(booking.totalPrice || 0)}</p>
                  <p>Created: {formatDate(booking.createdAt)}</p>
                </div>

                <div className="mt-4 grid gap-2 md:grid-cols-[180px,auto,auto,1fr] md:items-center">
                  <select
                    className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-sm"
                    onChange={(event) =>
                      setStatusDrafts((current) => ({
                        ...current,
                        [booking._id]: event.target.value,
                      }))
                    }
                    value={statusDrafts[booking._id] || booking.status}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  <button
                    className="btn-secondary"
                    onClick={() => saveStatus(booking._id)}
                    type="button"
                  >
                    Update Status
                  </button>

                  <button
                    className="rounded-xl bg-brand-moss px-4 py-2 text-sm font-medium text-white"
                    onClick={() => approveBooking(booking._id)}
                    type="button"
                  >
                    Approve
                  </button>

                  <button
                    className="rounded-xl bg-brand-coral px-4 py-2 text-sm font-medium text-white md:justify-self-start"
                    onClick={() => cancelBooking(booking._id)}
                    type="button"
                  >
                    Cancel Booking
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default AdminBookings;
