import { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import { Link, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  cancelBooking,
  createBooking,
  fetchUserBookings,
  modifyBooking,
} from "../redux/slices/bookingSlice";
import { fetchHotels } from "../redux/slices/hotelSlice";
import {
  fetchCurrentUser,
  updateCurrentUserProfile,
} from "../redux/slices/authSlice";
import paymentService from "../services/paymentService";
import reviewService from "../services/reviewService";
import { formatDate, toCurrency } from "../utils/format";

function UserDashboard() {
  const dispatch = useDispatch();
  const { bookings, loading: bookingLoading } = useSelector(
    (state) => state.bookings,
  );
  const { hotels, loading: hotelLoading } = useSelector(
    (state) => state.hotels,
  );
  const { user, loading: authLoading } = useSelector((state) => state.auth);
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const safeHotels = Array.isArray(hotels) ? hotels : [];
  const [activeTab, setActiveTab] = useState("history");
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [browseFilters, setBrowseFilters] = useState({
    location: "",
    minRating: "",
    minPrice: "",
    maxPrice: "",
    roomType: "",
    availableOnly: true,
  });
  const [selectedRoomInfo, setSelectedRoomInfo] = useState(null);
  const [roomCheckIn, setRoomCheckIn] = useState(new Date());
  const [roomCheckOut, setRoomCheckOut] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000),
  );
  const [guestCount, setGuestCount] = useState(1);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("stripe");
  const [payingBookingId, setPayingBookingId] = useState("");
  const [invoiceData, setInvoiceData] = useState(null);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [submittingReviewFor, setSubmittingReviewFor] = useState("");
  const [hotelReviewFeed, setHotelReviewFeed] = useState({
    hotelId: "",
    loading: false,
    reviews: [],
  });
  const [editingBookingId, setEditingBookingId] = useState("");
  const [editingBookingForm, setEditingBookingForm] = useState({
    checkIn: new Date(),
    checkOut: new Date(Date.now() + 24 * 60 * 60 * 1000),
    adults: 1,
    children: 0,
    numberOfRooms: 1,
    specialRequests: "",
  });

  useEffect(() => {
    setProfileForm({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
  }, [user]);

  const bookingHistory = useMemo(
    () =>
      [...safeBookings].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      ),
    [safeBookings],
  );

  const notifications = useMemo(() => {
    const now = new Date();
    const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const bookingConfirmations = bookingHistory
      .filter((booking) => booking.status && booking.status !== "cancelled")
      .map((booking) => ({
        id: `booking-confirm-${booking._id}`,
        type: "Booking confirmation",
        date: booking.createdAt || booking.checkIn,
        message: `Your booking for ${booking.hotel?.name || "hotel"} is ${booking.status}.`,
      }));

    const bookingReminders = bookingHistory
      .filter((booking) => {
        if (booking.status === "cancelled") {
          return false;
        }
        const checkInDate = booking.checkIn ? new Date(booking.checkIn) : null;
        if (!checkInDate) {
          return false;
        }
        return checkInDate >= now && checkInDate <= inThreeDays;
      })
      .map((booking) => ({
        id: `booking-reminder-${booking._id}`,
        type: "Booking reminder",
        date: booking.checkIn,
        message: `Reminder: Your stay at ${booking.hotel?.name || "hotel"} starts on ${formatDate(booking.checkIn)}.`,
      }));

    const paymentConfirmations = bookingHistory
      .filter((booking) => booking.paymentStatus === "paid")
      .map((booking) => ({
        id: `payment-confirm-${booking._id}`,
        type: "Payment confirmation",
        date: booking.paymentInfo?.paidAt || booking.createdAt,
        message: `Payment confirmed for ${booking.hotel?.name || "hotel"} (${toCurrency(booking.totalPrice)}).`,
      }));

    return [
      ...bookingConfirmations,
      ...bookingReminders,
      ...paymentConfirmations,
    ]
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 20);
  }, [bookingHistory]);

  const filteredHotels = useMemo(() => {
    const minRating = Number(browseFilters.minRating || 0);
    const minPrice = Number(browseFilters.minPrice || 0);
    const maxPrice = browseFilters.maxPrice
      ? Number(browseFilters.maxPrice)
      : Number.MAX_SAFE_INTEGER;

    return safeHotels
      .map((hotel) => {
        const rooms = Array.isArray(hotel.rooms) ? hotel.rooms : [];
        const matchedRooms = rooms.filter((room) => {
          const roomPrice = Number(room.price || 0);
          const typeMatches = browseFilters.roomType
            ? room.roomType === browseFilters.roomType
            : true;
          const priceMatches = roomPrice >= minPrice && roomPrice <= maxPrice;
          const availableMatches = browseFilters.availableOnly
            ? Number(room.availableRooms || 0) > 0
            : true;

          return typeMatches && priceMatches && availableMatches;
        });

        const locationText =
          `${hotel.address?.city || ""} ${hotel.address?.state || ""} ${hotel.address?.country || ""}`.toLowerCase();
        const locationMatches = browseFilters.location
          ? locationText.includes(browseFilters.location.toLowerCase())
          : true;
        const rating = Number(hotel.averageRating || hotel.starRating || 0);
        const ratingMatches = rating >= minRating;

        return {
          ...hotel,
          matchedRooms,
          matchedRoomCount: matchedRooms.length,
        };
      })
      .filter(
        (hotel) =>
          hotel.matchedRoomCount > 0 &&
          (browseFilters.location
            ? `${hotel.address?.city || ""} ${hotel.address?.state || ""} ${hotel.address?.country || ""}`
                .toLowerCase()
                .includes(browseFilters.location.toLowerCase())
            : true) &&
          Number(hotel.averageRating || hotel.starRating || 0) >= minRating,
      );
  }, [safeHotels, browseFilters]);

  useEffect(() => {
    dispatch(fetchUserBookings());
    dispatch(fetchCurrentUser());
    dispatch(fetchHotels());
  }, [dispatch]);

  if (user?.role === "admin") {
    return <Navigate to="/admin/analytics" replace />;
  }

  const onProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const onBrowseFilterChange = (event) => {
    const { name, value, type, checked } = event.target;
    setBrowseFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetBrowseFilters = () => {
    setBrowseFilters({
      location: "",
      minRating: "",
      minPrice: "",
      maxPrice: "",
      roomType: "",
      availableOnly: true,
    });
  };

  const openRoomDetails = (hotel, room) => {
    setSelectedRoomInfo({
      hotelId: hotel._id,
      hotelName: hotel.name,
      room,
      fallbackImages: hotel.images || [],
    });
    setRoomCheckIn(new Date());
    setRoomCheckOut(new Date(Date.now() + 24 * 60 * 60 * 1000));
    setGuestCount(1);
  };

  const submitRoomBooking = async (event) => {
    event.preventDefault();

    if (!selectedRoomInfo?.room?._id) {
      return;
    }

    if (roomCheckOut <= roomCheckIn) {
      return;
    }

    const result = await dispatch(
      createBooking({
        hotel: selectedRoomInfo.hotelId,
        room: selectedRoomInfo.room._id,
        checkIn: roomCheckIn,
        checkOut: roomCheckOut,
        guests: {
          adults: Math.max(1, Number(guestCount) || 1),
          children: 0,
        },
        numberOfRooms: 1,
      }),
    );

    if (createBooking.fulfilled.match(result)) {
      dispatch(fetchUserBookings());
      setActiveTab("history");
    }
  };

  const submitProfile = async (event) => {
    event.preventDefault();
    const result = await dispatch(
      updateCurrentUserProfile({
        name: profileForm.name.trim(),
        email: profileForm.email.trim().toLowerCase(),
        phone: profileForm.phone.trim(),
      }),
    );

    if (updateCurrentUserProfile.fulfilled.match(result)) {
      dispatch(fetchCurrentUser());
      setActiveTab("profile");
    }
  };

  const handlePayNow = async (bookingId) => {
    try {
      setPayingBookingId(bookingId);
      await paymentService.createPaymentIntent({
        bookingId,
        paymentMethod: selectedPaymentMethod,
      });
      toast.success("Payment completed successfully");
      dispatch(fetchUserBookings());
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
          error?.message ||
          "Payment processing failed",
      );
    } finally {
      setPayingBookingId("");
    }
  };

  const handleViewInvoice = async (bookingId) => {
    try {
      const data = await paymentService.getInvoice(bookingId);
      setInvoiceData(data);
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
          error?.message ||
          "Failed to load invoice",
      );
    }
  };

  const onReviewDraftChange = (bookingId, field, value) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [bookingId]: {
        rating: prev[bookingId]?.rating || 5,
        comment: prev[bookingId]?.comment || "",
        [field]: value,
      },
    }));
  };

  const submitReview = async (booking) => {
    const draft = reviewDrafts[booking._id] || { rating: 5, comment: "" };

    if (!draft.comment.trim()) {
      toast.error("Please add a review comment");
      return;
    }

    try {
      setSubmittingReviewFor(booking._id);
      await reviewService.createReview({
        hotel: booking.hotel?._id || booking.hotel,
        booking: booking._id,
        rating: Number(draft.rating) || 5,
        comment: draft.comment.trim(),
      });
      toast.success("Review submitted");
      setReviewDrafts((prev) => ({
        ...prev,
        [booking._id]: { rating: 5, comment: "" },
      }));
      await loadHotelReviews(booking.hotel?._id || booking.hotel);
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
          error?.message ||
          "Failed to submit review",
      );
    } finally {
      setSubmittingReviewFor("");
    }
  };

  const loadHotelReviews = async (hotelId) => {
    if (!hotelId) {
      return;
    }

    try {
      setHotelReviewFeed({ hotelId, loading: true, reviews: [] });
      const reviews = await reviewService.getHotelReviews(hotelId);
      setHotelReviewFeed({
        hotelId,
        loading: false,
        reviews: Array.isArray(reviews) ? reviews : [],
      });
    } catch (error) {
      setHotelReviewFeed({ hotelId, loading: false, reviews: [] });
      toast.error("Failed to load customer reviews");
    }
  };

  const openModifyBooking = (booking) => {
    setEditingBookingId(booking._id);
    setEditingBookingForm({
      checkIn: booking.checkIn ? new Date(booking.checkIn) : new Date(),
      checkOut: booking.checkOut
        ? new Date(booking.checkOut)
        : new Date(Date.now() + 24 * 60 * 60 * 1000),
      adults: Number(booking.guests?.adults) || 1,
      children: Number(booking.guests?.children) || 0,
      numberOfRooms: Number(booking.numberOfRooms) || 1,
      specialRequests: booking.specialRequests || "",
    });
  };

  const submitModifyBooking = async (event) => {
    event.preventDefault();

    if (!editingBookingId) {
      return;
    }

    const result = await dispatch(
      modifyBooking({
        id: editingBookingId,
        payload: {
          checkIn: editingBookingForm.checkIn,
          checkOut: editingBookingForm.checkOut,
          guests: {
            adults: Math.max(1, Number(editingBookingForm.adults) || 1),
            children: Math.max(0, Number(editingBookingForm.children) || 0),
          },
          numberOfRooms: Math.max(
            1,
            Number(editingBookingForm.numberOfRooms) || 1,
          ),
          specialRequests: editingBookingForm.specialRequests,
        },
      }),
    );

    if (modifyBooking.fulfilled.match(result)) {
      setEditingBookingId("");
    }
  };

  return (
    <section className="container-pad py-10">
      <div className="grid gap-5 md:grid-cols-[250px,1fr]">
        <aside className="panel h-fit p-4">
          <h2 className="font-display text-2xl">My Space</h2>
          <p className="mt-1 text-sm text-brand-ink/75 dark:text-slate-300">
            {user?.name ? user.name : "Guest User"}
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <button
              className={`w-full rounded-lg px-3 py-2 text-left ${
                activeTab === "history"
                  ? "bg-white/85 font-medium text-brand-ink dark:bg-slate-100 dark:text-slate-900"
                  : "bg-white/50 text-brand-ink/70 dark:bg-slate-800/70 dark:text-slate-200"
              }`}
              onClick={() => setActiveTab("history")}
              type="button"
            >
              Booking History
            </button>
            <button
              className={`w-full rounded-lg px-3 py-2 text-left ${
                activeTab === "profile"
                  ? "bg-white/85 font-medium text-brand-ink dark:bg-slate-100 dark:text-slate-900"
                  : "bg-white/50 text-brand-ink/70 dark:bg-slate-800/70 dark:text-slate-200"
              }`}
              onClick={() => setActiveTab("profile")}
              type="button"
            >
              View Profile
            </button>
            <button
              className={`w-full rounded-lg px-3 py-2 text-left ${
                activeTab === "edit"
                  ? "bg-white/85 font-medium text-brand-ink dark:bg-slate-100 dark:text-slate-900"
                  : "bg-white/50 text-brand-ink/70 dark:bg-slate-800/70 dark:text-slate-200"
              }`}
              onClick={() => setActiveTab("edit")}
              type="button"
            >
              Edit Profile
            </button>
            <button
              className={`w-full rounded-lg px-3 py-2 text-left ${
                activeTab === "browse"
                  ? "bg-white/85 font-medium text-brand-ink dark:bg-slate-100 dark:text-slate-900"
                  : "bg-white/50 text-brand-ink/70 dark:bg-slate-800/70 dark:text-slate-200"
              }`}
              onClick={() => setActiveTab("browse")}
              type="button"
            >
              Browse Hotels
            </button>
            <button
              className={`w-full rounded-lg px-3 py-2 text-left ${
                activeTab === "payments"
                  ? "bg-white/85 font-medium text-brand-ink dark:bg-slate-100 dark:text-slate-900"
                  : "bg-white/50 text-brand-ink/70 dark:bg-slate-800/70 dark:text-slate-200"
              }`}
              onClick={() => setActiveTab("payments")}
              type="button"
            >
              Payments
            </button>
            <button
              className={`w-full rounded-lg px-3 py-2 text-left ${
                activeTab === "reviews"
                  ? "bg-white/85 font-medium text-brand-ink dark:bg-slate-100 dark:text-slate-900"
                  : "bg-white/50 text-brand-ink/70 dark:bg-slate-800/70 dark:text-slate-200"
              }`}
              onClick={() => setActiveTab("reviews")}
              type="button"
            >
              Reviews & Ratings
            </button>
            <button
              className={`w-full rounded-lg px-3 py-2 text-left ${
                activeTab === "notifications"
                  ? "bg-white/85 font-medium text-brand-ink dark:bg-slate-100 dark:text-slate-900"
                  : "bg-white/50 text-brand-ink/70 dark:bg-slate-800/70 dark:text-slate-200"
              }`}
              onClick={() => setActiveTab("notifications")}
              type="button"
            >
              Notifications ({notifications.length})
            </button>
          </div>
        </aside>

        <div>
          <h1 className="font-display text-4xl">My Dashboard</h1>
          <p className="mt-1 text-brand-ink/75 dark:text-slate-300">
            Welcome back{user?.name ? `, ${user.name}` : ""}.
          </p>

          <div className="mt-6 panel p-5 md:p-6">
            {activeTab === "history" && (
              <>
                <h2 className="mb-4 text-lg font-semibold">Booking History</h2>
                {bookingLoading ? (
                  <p className="text-brand-ink/75 dark:text-slate-300">
                    Loading bookings...
                  </p>
                ) : bookingHistory.length === 0 ? (
                  <p className="text-brand-ink/75 dark:text-slate-300">
                    No bookings found yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {bookingHistory.map((booking) => (
                      <div
                        className="rounded-2xl border border-brand-ink/10 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-800/70"
                        key={booking._id}
                      >
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div className="text-sm">
                            <p className="font-medium">
                              Hotel: {booking.hotel?.name || "N/A"}
                            </p>
                            <p>Room: {booking.room?.roomType || "N/A"}</p>
                            <p>
                              Stay: {formatDate(booking.checkIn)} -{" "}
                              {formatDate(booking.checkOut)}
                            </p>
                          </div>
                          <div className="text-sm md:text-right">
                            <p className="font-semibold">
                              {toCurrency(booking.totalPrice)}
                            </p>
                            <p>Status: {booking.status || "pending"}</p>
                            <p>Payment: {booking.paymentStatus || "pending"}</p>
                          </div>
                        </div>

                        {booking.status !== "cancelled" && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              className="btn-secondary"
                              type="button"
                              onClick={() =>
                                dispatch(cancelBooking(booking._id))
                              }
                            >
                              Cancel Booking
                            </button>
                            {booking.status !== "completed" && (
                              <button
                                className="btn-secondary"
                                type="button"
                                onClick={() => openModifyBooking(booking)}
                              >
                                Modify Booking
                              </button>
                            )}
                          </div>
                        )}

                        {editingBookingId === booking._id && (
                          <form
                            className="mt-4 grid gap-3 rounded-xl border border-brand-ink/10 bg-white/60 p-3 text-sm dark:border-slate-600 dark:bg-slate-900/60"
                            onSubmit={submitModifyBooking}
                          >
                            <div className="grid gap-3 md:grid-cols-2">
                              <div>
                                <p className="mb-1 text-xs text-brand-ink/70 dark:text-slate-300">
                                  Check-in
                                </p>
                                <DatePicker
                                  className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-brand-ink dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                                  minDate={new Date()}
                                  onChange={(date) =>
                                    setEditingBookingForm((prev) => ({
                                      ...prev,
                                      checkIn: date || new Date(),
                                    }))
                                  }
                                  selected={editingBookingForm.checkIn}
                                />
                              </div>
                              <div>
                                <p className="mb-1 text-xs text-brand-ink/70 dark:text-slate-300">
                                  Check-out
                                </p>
                                <DatePicker
                                  className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-brand-ink dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                                  minDate={
                                    new Date(
                                      editingBookingForm.checkIn.getTime() +
                                        24 * 60 * 60 * 1000,
                                    )
                                  }
                                  onChange={(date) =>
                                    setEditingBookingForm((prev) => ({
                                      ...prev,
                                      checkOut:
                                        date ||
                                        new Date(
                                          prev.checkIn.getTime() +
                                            24 * 60 * 60 * 1000,
                                        ),
                                    }))
                                  }
                                  selected={editingBookingForm.checkOut}
                                />
                              </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-3">
                              <input
                                className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-brand-ink dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                                min="1"
                                onChange={(event) =>
                                  setEditingBookingForm((prev) => ({
                                    ...prev,
                                    adults: Number(event.target.value) || 1,
                                  }))
                                }
                                placeholder="Adults"
                                type="number"
                                value={editingBookingForm.adults}
                              />
                              <input
                                className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-brand-ink dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                                min="0"
                                onChange={(event) =>
                                  setEditingBookingForm((prev) => ({
                                    ...prev,
                                    children: Number(event.target.value) || 0,
                                  }))
                                }
                                placeholder="Children"
                                type="number"
                                value={editingBookingForm.children}
                              />
                              <input
                                className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-brand-ink dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                                min="1"
                                onChange={(event) =>
                                  setEditingBookingForm((prev) => ({
                                    ...prev,
                                    numberOfRooms:
                                      Number(event.target.value) || 1,
                                  }))
                                }
                                placeholder="Rooms"
                                type="number"
                                value={editingBookingForm.numberOfRooms}
                              />
                            </div>

                            <textarea
                              className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-brand-ink dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                              onChange={(event) =>
                                setEditingBookingForm((prev) => ({
                                  ...prev,
                                  specialRequests: event.target.value,
                                }))
                              }
                              placeholder="Special requests"
                              rows={2}
                              value={editingBookingForm.specialRequests}
                            />

                            <div className="flex flex-wrap gap-2">
                              <button
                                className="btn-primary"
                                disabled={bookingLoading}
                                type="submit"
                              >
                                {bookingLoading
                                  ? "Updating..."
                                  : "Save Changes"}
                              </button>
                              <button
                                className="btn-secondary"
                                onClick={() => setEditingBookingId("")}
                                type="button"
                              >
                                Cancel Edit
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "profile" && (
              <>
                <h2 className="mb-4 text-lg font-semibold">Profile Details</h2>
                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <div className="rounded-xl border border-brand-ink/10 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                    <p className="text-brand-ink/70 dark:text-slate-300">
                      Name
                    </p>
                    <p className="font-medium">{user?.name || "N/A"}</p>
                  </div>
                  <div className="rounded-xl border border-brand-ink/10 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                    <p className="text-brand-ink/70 dark:text-slate-300">
                      Email
                    </p>
                    <p className="font-medium">{user?.email || "N/A"}</p>
                  </div>
                  <div className="rounded-xl border border-brand-ink/10 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                    <p className="text-brand-ink/70 dark:text-slate-300">
                      Phone
                    </p>
                    <p className="font-medium">{user?.phone || "Not added"}</p>
                  </div>
                  <div className="rounded-xl border border-brand-ink/10 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                    <p className="text-brand-ink/70 dark:text-slate-300">
                      Role
                    </p>
                    <p className="font-medium">{user?.role || "user"}</p>
                  </div>
                </div>
              </>
            )}

            {activeTab === "edit" && (
              <>
                <h2 className="mb-4 text-lg font-semibold">Edit Profile</h2>
                <form className="space-y-4" onSubmit={submitProfile}>
                  <input
                    className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-brand-ink dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    name="name"
                    onChange={onProfileChange}
                    placeholder="Full name"
                    value={profileForm.name}
                  />
                  <input
                    className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-brand-ink dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    name="email"
                    onChange={onProfileChange}
                    placeholder="Email"
                    type="email"
                    value={profileForm.email}
                  />
                  <input
                    className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-brand-ink dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    name="phone"
                    onChange={onProfileChange}
                    placeholder="Phone"
                    value={profileForm.phone}
                  />
                  <button
                    className="btn-primary"
                    disabled={authLoading}
                    type="submit"
                  >
                    {authLoading ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              </>
            )}

            {activeTab === "browse" && (
              <>
                <h2 className="mb-4 text-lg font-semibold">
                  Browse Hotels & Rooms
                </h2>

                <div className="grid gap-3 rounded-2xl border border-brand-ink/10 bg-white/60 p-4 dark:border-slate-700 dark:bg-slate-800/60 md:grid-cols-2 lg:grid-cols-3">
                  <input
                    className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-brand-ink dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    name="location"
                    onChange={onBrowseFilterChange}
                    placeholder="Search by location"
                    value={browseFilters.location}
                  />
                  <input
                    className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-brand-ink dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    max="5"
                    min="1"
                    name="minRating"
                    onChange={onBrowseFilterChange}
                    placeholder="Min rating"
                    type="number"
                    value={browseFilters.minRating}
                  />
                  <input
                    className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-brand-ink dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    min="0"
                    name="minPrice"
                    onChange={onBrowseFilterChange}
                    placeholder="Min price"
                    type="number"
                    value={browseFilters.minPrice}
                  />
                  <input
                    className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-brand-ink dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    min="0"
                    name="maxPrice"
                    onChange={onBrowseFilterChange}
                    placeholder="Max price"
                    type="number"
                    value={browseFilters.maxPrice}
                  />
                  <select
                    className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-brand-ink dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    name="roomType"
                    onChange={onBrowseFilterChange}
                    value={browseFilters.roomType}
                  >
                    <option value="">All room types</option>
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                    <option value="Suite">Suite</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="Presidential">Presidential</option>
                  </select>
                  <label className="flex items-center gap-2 rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                    <input
                      checked={browseFilters.availableOnly}
                      name="availableOnly"
                      onChange={onBrowseFilterChange}
                      type="checkbox"
                    />
                    Show available only
                  </label>
                  <button
                    className="btn-secondary md:col-span-2 lg:col-span-3"
                    onClick={resetBrowseFilters}
                    type="button"
                  >
                    Reset Filters
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {hotelLoading ? (
                    <p className="text-brand-ink/75 dark:text-slate-300">
                      Loading hotels...
                    </p>
                  ) : filteredHotels.length === 0 ? (
                    <p className="text-brand-ink/75 dark:text-slate-300">
                      No hotels/rooms matched your filters.
                    </p>
                  ) : (
                    filteredHotels.map((hotel) => (
                      <article
                        className="rounded-2xl border border-brand-ink/10 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-800/70"
                        key={hotel._id}
                      >
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">
                              {hotel.name}
                            </h3>
                            <p className="text-sm text-brand-ink/70 dark:text-slate-300">
                              {hotel.address?.city || "City"},{" "}
                              {hotel.address?.country || "Country"}
                            </p>
                            <p className="text-sm text-brand-ink/70 dark:text-slate-300">
                              Rating:{" "}
                              {hotel.averageRating || hotel.starRating || 0}
                            </p>
                          </div>
                          <Link
                            className="btn-primary"
                            to={`/hotels/${hotel._id}`}
                          >
                            View Details
                          </Link>
                        </div>

                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          {hotel.matchedRooms.slice(0, 4).map((room) => (
                            <div
                              className="rounded-xl border border-brand-ink/10 bg-white/60 p-3 text-sm dark:border-slate-700 dark:bg-slate-900/70"
                              key={room._id}
                            >
                              <p className="font-medium">{room.roomType}</p>
                              <p>Price: {toCurrency(room.price)} / night</p>
                              <p>Available: {room.availableRooms}</p>
                              <button
                                className="btn-secondary mt-2"
                                onClick={() => openRoomDetails(hotel, room)}
                                type="button"
                              >
                                Room Details
                              </button>
                            </div>
                          ))}
                        </div>
                      </article>
                    ))
                  )}
                </div>

                {selectedRoomInfo && (
                  <div className="mt-6 rounded-2xl border border-brand-ink/10 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-800/70 md:p-5">
                    <h3 className="font-display text-2xl">Room Details</h3>
                    <p className="text-sm text-brand-ink/70 dark:text-slate-300">
                      {selectedRoomInfo.hotelName} -{" "}
                      {selectedRoomInfo.room.roomType}
                    </p>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div>
                        {Array.isArray(selectedRoomInfo.room.images) &&
                        selectedRoomInfo.room.images.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {selectedRoomInfo.room.images
                              .slice(0, 4)
                              .map((img, index) => (
                                <img
                                  key={`${img.url || "room-img"}-${index}`}
                                  alt={`${selectedRoomInfo.room.roomType} ${index + 1}`}
                                  className="h-28 w-full rounded-xl object-cover"
                                  src={img.url}
                                />
                              ))}
                          </div>
                        ) : Array.isArray(selectedRoomInfo.fallbackImages) &&
                          selectedRoomInfo.fallbackImages.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {selectedRoomInfo.fallbackImages
                              .slice(0, 4)
                              .map((img, index) => (
                                <img
                                  key={`${img.url || "hotel-img"}-${index}`}
                                  alt={`Hotel view ${index + 1}`}
                                  className="h-28 w-full rounded-xl object-cover"
                                  src={img.url}
                                />
                              ))}
                          </div>
                        ) : (
                          <div className="h-40 rounded-xl bg-gradient-to-r from-brand-clay/60 to-brand-moss/60" />
                        )}

                        <div className="mt-3 space-y-1 text-sm">
                          <p className="font-medium">Description</p>
                          <p className="text-brand-ink/75 dark:text-slate-300">
                            {selectedRoomInfo.room.description ||
                              "Comfortable room with modern amenities."}
                          </p>
                          <p>
                            <span className="font-medium">
                              Price per night:
                            </span>{" "}
                            {toCurrency(selectedRoomInfo.room.price)}
                          </p>
                          <p>
                            <span className="font-medium">
                              Current availability:
                            </span>{" "}
                            {selectedRoomInfo.room.availableRooms} rooms
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-sm font-medium">
                          Room Facilities
                        </p>
                        {Array.isArray(selectedRoomInfo.room.amenities) &&
                        selectedRoomInfo.room.amenities.length > 0 ? (
                          <div className="mb-4 flex flex-wrap gap-2">
                            {selectedRoomInfo.room.amenities.map((amenity) => (
                              <span
                                className="rounded-full border border-brand-ink/15 bg-white/80 px-3 py-1 text-xs dark:border-slate-600 dark:bg-slate-900"
                                key={amenity}
                              >
                                {amenity}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mb-4 text-sm text-brand-ink/70 dark:text-slate-300">
                            Facilities not listed for this room yet.
                          </p>
                        )}

                        <p className="mb-2 text-sm font-medium">
                          Availability Calendar
                        </p>
                        <form
                          className="grid gap-3"
                          onSubmit={submitRoomBooking}
                        >
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <p className="mb-1 text-xs text-brand-ink/70 dark:text-slate-300">
                                Check-in date
                              </p>
                              <DatePicker
                                className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-brand-ink dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                                minDate={new Date()}
                                onChange={(date) =>
                                  setRoomCheckIn(date || new Date())
                                }
                                selected={roomCheckIn}
                              />
                            </div>
                            <div>
                              <p className="mb-1 text-xs text-brand-ink/70 dark:text-slate-300">
                                Check-out date
                              </p>
                              <DatePicker
                                className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-brand-ink dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                                minDate={
                                  new Date(
                                    roomCheckIn.getTime() + 24 * 60 * 60 * 1000,
                                  )
                                }
                                onChange={(date) =>
                                  setRoomCheckOut(
                                    date ||
                                      new Date(
                                        roomCheckIn.getTime() +
                                          24 * 60 * 60 * 1000,
                                      ),
                                  )
                                }
                                selected={roomCheckOut}
                              />
                            </div>
                          </div>

                          <div>
                            <p className="mb-1 text-xs text-brand-ink/70 dark:text-slate-300">
                              Number of guests
                            </p>
                            <input
                              className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-brand-ink dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                              max={selectedRoomInfo.room.capacity?.adults || 10}
                              min="1"
                              onChange={(event) =>
                                setGuestCount(Number(event.target.value) || 1)
                              }
                              type="number"
                              value={guestCount}
                            />
                          </div>

                          <div>
                            <p className="text-xs text-brand-ink/70 dark:text-slate-300">
                              Guests limit for this room: up to{" "}
                              {selectedRoomInfo.room.capacity?.adults || 10}{" "}
                              adults.
                            </p>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              className="btn-primary"
                              disabled={bookingLoading}
                              type="submit"
                            >
                              {bookingLoading ? "Booking..." : "Book Room"}
                            </button>
                            <Link
                              className="btn-secondary"
                              to={`/booking/${selectedRoomInfo.hotelId}`}
                            >
                              Open Full Booking Page
                            </Link>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "payments" && (
              <>
                <h2 className="mb-4 text-lg font-semibold">Payment System</h2>
                <div className="mb-4 rounded-2xl border border-brand-ink/10 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                  <p className="mb-2 text-sm font-medium">
                    Online payment method
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        checked={selectedPaymentMethod === "stripe"}
                        name="paymentMethod"
                        onChange={() => setSelectedPaymentMethod("stripe")}
                        type="radio"
                      />
                      Stripe
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        checked={selectedPaymentMethod === "paypal"}
                        name="paymentMethod"
                        onChange={() => setSelectedPaymentMethod("paypal")}
                        type="radio"
                      />
                      PayPal
                    </label>
                  </div>
                </div>

                <h3 className="mb-3 text-base font-semibold">
                  Payment History
                </h3>
                {bookingHistory.length === 0 ? (
                  <p className="text-brand-ink/75 dark:text-slate-300">
                    No payment records found.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {bookingHistory.map((booking) => (
                      <div
                        className="rounded-2xl border border-brand-ink/10 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-800/70"
                        key={`pay-${booking._id}`}
                      >
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div className="text-sm">
                            <p className="font-medium">
                              Hotel: {booking.hotel?.name || "N/A"}
                            </p>
                            <p>Booking ID: {booking._id}</p>
                            <p>
                              Payment Status:{" "}
                              {booking.paymentStatus || "pending"}
                            </p>
                            <p>
                              Method:{" "}
                              {booking.paymentInfo?.paymentMethod || "-"}
                            </p>
                          </div>
                          <div className="text-sm md:text-right">
                            <p className="font-semibold">
                              {toCurrency(booking.totalPrice)}
                            </p>
                            <p>
                              Paid At:{" "}
                              {booking.paymentInfo?.paidAt
                                ? formatDate(booking.paymentInfo.paidAt)
                                : "-"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {booking.paymentStatus !== "paid" &&
                            booking.status !== "cancelled" && (
                              <button
                                className="btn-primary"
                                disabled={payingBookingId === booking._id}
                                onClick={() => handlePayNow(booking._id)}
                                type="button"
                              >
                                {payingBookingId === booking._id
                                  ? "Processing..."
                                  : "Pay Now"}
                              </button>
                            )}
                          <button
                            className="btn-secondary"
                            onClick={() => handleViewInvoice(booking._id)}
                            type="button"
                          >
                            Generate Invoice
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {invoiceData && (
                  <div className="mt-5 rounded-2xl border border-brand-ink/10 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold">Invoice</h3>
                      <button
                        className="btn-secondary"
                        onClick={() => window.print()}
                        type="button"
                      >
                        Print / Save PDF
                      </button>
                    </div>
                    <p className="mt-1 text-sm">
                      Invoice #: {invoiceData.invoiceNumber}
                    </p>
                    <p className="text-sm">
                      Customer: {invoiceData.customer?.name}
                    </p>
                    <p className="text-sm">
                      Email: {invoiceData.customer?.email}
                    </p>
                    <p className="text-sm">
                      Hotel: {invoiceData.hotel?.name} (
                      {invoiceData.hotel?.city}, {invoiceData.hotel?.country})
                    </p>
                    <p className="text-sm">Room: {invoiceData.room?.type}</p>
                    <p className="text-sm">
                      Stay: {formatDate(invoiceData.stay?.checkIn)} -{" "}
                      {formatDate(invoiceData.stay?.checkOut)} (
                      {invoiceData.stay?.nights} nights)
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      Total: {toCurrency(invoiceData.totals?.amount)}{" "}
                      {invoiceData.totals?.currency}
                    </p>
                    <p className="text-sm">
                      Payment Status: {invoiceData.payment?.status}
                    </p>
                    <p className="text-sm">
                      Payment ID: {invoiceData.payment?.paymentId || "-"}
                    </p>
                  </div>
                )}
              </>
            )}

            {activeTab === "reviews" && (
              <>
                <h2 className="mb-4 text-lg font-semibold">
                  Reviews & Ratings
                </h2>

                {bookingHistory.filter(
                  (booking) => booking.status !== "cancelled",
                ).length === 0 ? (
                  <p className="text-brand-ink/75 dark:text-slate-300">
                    You have no eligible bookings for reviews yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {bookingHistory
                      .filter((booking) => booking.status !== "cancelled")
                      .map((booking) => {
                        const draft = reviewDrafts[booking._id] || {
                          rating: 5,
                          comment: "",
                        };
                        const hotelId = booking.hotel?._id || booking.hotel;

                        return (
                          <article
                            className="rounded-2xl border border-brand-ink/10 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-800/70"
                            key={`review-${booking._id}`}
                          >
                            <div className="mb-3 text-sm">
                              <p className="font-medium">
                                Hotel: {booking.hotel?.name || "N/A"}
                              </p>
                              <p>Room: {booking.room?.roomType || "N/A"}</p>
                              <p>
                                Stay: {formatDate(booking.checkIn)} -{" "}
                                {formatDate(booking.checkOut)}
                              </p>
                            </div>

                            <div className="grid gap-3 md:grid-cols-[180px,1fr]">
                              <div>
                                <label className="mb-1 block text-xs text-brand-ink/70 dark:text-slate-300">
                                  Rate this room
                                </label>
                                <select
                                  className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-sm text-brand-ink dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                                  onChange={(event) =>
                                    onReviewDraftChange(
                                      booking._id,
                                      "rating",
                                      Number(event.target.value),
                                    )
                                  }
                                  value={draft.rating}
                                >
                                  <option value={5}>5 - Excellent</option>
                                  <option value={4}>4 - Very Good</option>
                                  <option value={3}>3 - Good</option>
                                  <option value={2}>2 - Fair</option>
                                  <option value={1}>1 - Poor</option>
                                </select>
                              </div>

                              <div>
                                <label className="mb-1 block text-xs text-brand-ink/70 dark:text-slate-300">
                                  Leave review
                                </label>
                                <textarea
                                  className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-sm text-brand-ink dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                                  onChange={(event) =>
                                    onReviewDraftChange(
                                      booking._id,
                                      "comment",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Share your room and stay experience"
                                  rows={3}
                                  value={draft.comment}
                                />
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                className="btn-primary"
                                disabled={submittingReviewFor === booking._id}
                                onClick={() => submitReview(booking)}
                                type="button"
                              >
                                {submittingReviewFor === booking._id
                                  ? "Submitting..."
                                  : "Submit Review"}
                              </button>
                              <button
                                className="btn-secondary"
                                onClick={() => loadHotelReviews(hotelId)}
                                type="button"
                              >
                                View Other Customer Reviews
                              </button>
                            </div>

                            {hotelReviewFeed.hotelId === hotelId && (
                              <div className="mt-4 rounded-xl border border-brand-ink/10 bg-white/60 p-3 dark:border-slate-700 dark:bg-slate-900/70">
                                <p className="mb-2 text-sm font-medium">
                                  Other customer reviews
                                </p>
                                {hotelReviewFeed.loading ? (
                                  <p className="text-sm text-brand-ink/75 dark:text-slate-300">
                                    Loading reviews...
                                  </p>
                                ) : hotelReviewFeed.reviews.length === 0 ? (
                                  <p className="text-sm text-brand-ink/75 dark:text-slate-300">
                                    No reviews yet for this hotel.
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {hotelReviewFeed.reviews
                                      .slice(0, 5)
                                      .map((review) => (
                                        <div
                                          className="rounded-lg border border-brand-ink/10 bg-white/80 p-2 text-sm dark:border-slate-700 dark:bg-slate-800/80"
                                          key={review._id}
                                        >
                                          <p className="font-medium">
                                            {review.user?.name || "Customer"} -{" "}
                                            {review.rating}/5
                                          </p>
                                          <p className="text-brand-ink/80 dark:text-slate-300">
                                            {review.comment}
                                          </p>
                                        </div>
                                      ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </article>
                        );
                      })}
                  </div>
                )}
              </>
            )}

            {activeTab === "notifications" && (
              <>
                <h2 className="mb-4 text-lg font-semibold">Notifications</h2>
                {notifications.length === 0 ? (
                  <p className="text-brand-ink/75 dark:text-slate-300">
                    No notifications available right now.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((item) => (
                      <div
                        className="rounded-2xl border border-brand-ink/10 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-800/70"
                        key={item.id}
                      >
                        <p className="text-sm font-semibold">{item.type}</p>
                        <p className="text-sm text-brand-ink/80 dark:text-slate-300">
                          {item.message}
                        </p>
                        <p className="mt-1 text-xs text-brand-ink/60 dark:text-slate-400">
                          {formatDate(item.date)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default UserDashboard;
