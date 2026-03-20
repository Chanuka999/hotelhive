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
import heroImg from "../assets/jetwing-hero.png";

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
    <section className="container-pad py-10 text-brand-ink dark:text-slate-100">
      <div className="flex flex-col gap-8">
        <header className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl">
          <img
            alt="Dashboard Banner"
            className="absolute inset-0 h-full w-full object-cover opacity-40"
            src={heroImg}
          />
          <div className="relative z-10 flex flex-col justify-end p-6 md:p-10 lg:h-56">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="font-display text-3xl font-bold md:text-5xl">
                  Hello, {user?.name.split(" ")[0] || "Guest"}!
                </h1>
                <p className="mt-2 text-lg text-white/80">
                  Welcome back to HotelHive. Ready for your next getaway?
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  className="rounded-full bg-brand-coral px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110 active:scale-95"
                  onClick={() => setActiveTab("browse")}
                  type="button"
                >
                  Book New Stay
                </button>
              </div>
            </div>
          </div>
        </header>

        <nav className="sticky top-4 z-20 flex items-center gap-2 overflow-x-auto rounded-2xl bg-white/80 p-2 shadow-lg backdrop-blur-xl dark:bg-slate-800/80">
          <button
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "history"
                ? "bg-brand-coral text-white shadow-md shadow-brand-coral/20"
                : "text-brand-ink/70 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
            onClick={() => setActiveTab("history")}
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Booking History
          </button>
          <button
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "profile"
                ? "bg-brand-coral text-white shadow-md shadow-brand-coral/20"
                : "text-brand-ink/70 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
            onClick={() => setActiveTab("profile")}
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            View Profile
          </button>
          <button
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "edit"
                ? "bg-brand-coral text-white shadow-md shadow-brand-coral/20"
                : "text-brand-ink/70 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
            onClick={() => setActiveTab("edit")}
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            Edit Profile
          </button>
          <button
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "browse"
                ? "bg-brand-coral text-white shadow-md shadow-brand-coral/20"
                : "text-brand-ink/70 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
            onClick={() => setActiveTab("browse")}
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            Browse Hotels
          </button>
          <button
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "payments"
                ? "bg-brand-coral text-white shadow-md shadow-brand-coral/20"
                : "text-brand-ink/70 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
            onClick={() => setActiveTab("payments")}
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
            Payments
          </button>
          <button
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "reviews"
                ? "bg-brand-coral text-white shadow-md shadow-brand-coral/20"
                : "text-brand-ink/70 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
            onClick={() => setActiveTab("reviews")}
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            Reviews & Ratings
          </button>
          <button
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "notifications"
                ? "bg-brand-coral text-white shadow-md shadow-brand-coral/20"
                : "text-brand-ink/70 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
            onClick={() => setActiveTab("notifications")}
            type="button"
          >
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
              {notifications.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                  {notifications.length}
                </span>
              )}
            </div>
            Notifications
          </button>
        </nav>

        <div className="min-w-0">
          <div className="mb-0 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="panel flex flex-col gap-1 border-brand-coral/20 p-4 transition-transform hover:-translate-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-ink/60 dark:text-slate-400">
                Total Bookings
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{safeBookings.length}</span>
                <div className="rounded-full bg-brand-coral/10 p-2 text-brand-coral">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                </div>
              </div>
            </div>
            <div className="panel flex flex-col gap-1 border-blue-500/20 p-4 transition-transform hover:-translate-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-ink/60 dark:text-slate-400">
                Pending Stay
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {safeBookings.filter((b) => b.status === "pending").length}
                </span>
                <div className="rounded-full bg-blue-500/10 p-2 text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                </div>
              </div>
            </div>
            <div className="panel flex flex-col gap-1 border-green-500/20 p-4 transition-transform hover:-translate-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-ink/60 dark:text-slate-400">
                Total Spent
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {toCurrency(
                    safeBookings
                      .filter((b) => b.paymentStatus === "paid")
                      .reduce((acc, b) => acc + (b.totalPrice || 0), 0),
                  )}
                </span>
                <div className="rounded-full bg-green-500/10 p-2 text-green-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
                </div>
              </div>
            </div>
            <div className="panel flex flex-col gap-1 border-orange-500/20 p-4 transition-transform hover:-translate-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-ink/60 dark:text-slate-400">
                Notifications
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{notifications.length}</span>
                <div className="rounded-full bg-orange-500/10 p-2 text-orange-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
                </div>
              </div>
            </div>
          </div>
        </div>

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
                  <div className="space-y-4">
                    {bookingHistory.map((booking) => (
                      <div
                        className="overflow-hidden rounded-2xl border border-brand-ink/10 bg-white/80 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80"
                        key={booking._id}
                      >
                        <div className="flex flex-col md:flex-row">
                          <div className="relative h-48 w-full shrink-0 md:h-auto md:w-56">
                            <img
                              alt={booking.hotel?.name || "Hotel"}
                              className="h-full w-full object-cover"
                              src={
                                booking.room?.images?.[0]?.url ||
                                booking.hotel?.images?.[0]?.url ||
                                heroImg
                              }
                            />
                            <div className="absolute left-3 top-3">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-sm ${
                                  booking.status === "confirmed"
                                    ? "bg-green-500 text-white"
                                    : booking.status === "cancelled"
                                      ? "bg-red-500 text-white"
                                      : "bg-orange-500 text-white"
                                }`}
                              >
                                {booking.status || "pending"}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-1 flex-col justify-between p-4 md:p-5">
                            <div>
                              <div className="flex items-start justify-between">
                                <h3 className="font-display text-xl font-bold">
                                  {booking.hotel?.name || "N/A"}
                                </h3>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-brand-coral">
                                    {toCurrency(booking.totalPrice)}
                                  </p>
                                  <p className="text-xs text-brand-ink/60 dark:text-slate-400">
                                    {booking.paymentStatus === "paid"
                                      ? "✓ Paid"
                                      : "⚠️ Payment Pending"}
                                  </p>
                                </div>
                              </div>
                              <p className="mt-1 text-sm font-medium text-brand-ink/70 dark:text-slate-300">
                                {booking.room?.roomType || "Standard Room"}
                              </p>
                              <div className="mt-3 flex items-center gap-4 text-sm text-brand-ink/60 dark:text-slate-400">
                                <div className="flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                  {formatDate(booking.checkIn)}
                                </div>
                                <span>→</span>
                                <div className="flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                  {formatDate(booking.checkOut)}
                                </div>
                              </div>
                            </div>

                            {booking.status !== "cancelled" && (
                              <div className="mt-5 flex flex-wrap items-center gap-3">
                                <button
                                  className="rounded-xl bg-brand-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-ink/90 dark:bg-slate-700 dark:hover:bg-slate-600"
                                  onClick={() => openModifyBooking(booking)}
                                  type="button"
                                >
                                  Modify Booking
                                </button>
                                <button
                                  className="rounded-xl border border-red-500/20 px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-500 hover:text-white"
                                  onClick={() =>
                                    dispatch(cancelBooking(booking._id))
                                  }
                                  type="button"
                                >
                                  Cancel
                                </button>
                                {booking.paymentStatus !== "paid" && (
                                  <button
                                    className="rounded-xl bg-brand-coral px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
                                    onClick={() => handlePayNow(booking._id)}
                                    type="button"
                                  >
                                    Pay Now
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {editingBookingId === booking._id && (
                          <div className="border-t border-brand-ink/10 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
                            <form
                              className="grid gap-4"
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
                          </div>
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
      </section>
  );
}

export default UserDashboard;
