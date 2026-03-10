import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from "recharts";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from "chart.js";
import adminService from "../services/adminService";
import hotelService from "../services/hotelService";
import { toCurrency } from "../utils/format";

ChartJS.register(ArcElement, ChartTooltip, ChartLegend);

function StatCard({ title, value }) {
  return (
    <div className="panel p-5">
      <p className="text-sm text-brand-ink/70">{title}</p>
      <p className="mt-2 font-display text-4xl">{value}</p>
    </div>
  );
}

function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isHotelsOpen, setIsHotelsOpen] = useState(false);
  const [hotelForm, setHotelForm] = useState({
    name: "",
    description: "",
    city: "",
    country: "",
    starRating: 3,
    basePrice: 0,
    discountPercent: 0,
  });

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const [data, hotelRows] = await Promise.all([
          adminService.getAnalytics(),
          hotelService.getHotels(),
        ]);
        setAnalytics(data);
        setHotels(Array.isArray(hotelRows) ? hotelRows : []);
      } catch (err) {
        setError(err?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const reloadHotels = async () => {
    const hotelRows = await hotelService.getHotels();
    setHotels(Array.isArray(hotelRows) ? hotelRows : []);
  };

  const createHotelHandler = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await hotelService.createHotel({
        name: hotelForm.name,
        description: hotelForm.description,
        starRating: Number(hotelForm.starRating),
        basePrice: Number(hotelForm.basePrice),
        discountPercent: Number(hotelForm.discountPercent),
        address: {
          city: hotelForm.city,
          country: hotelForm.country,
        },
      });
      setMessage("Hotel added");
      setHotelForm({
        name: "",
        description: "",
        city: "",
        country: "",
        starRating: 3,
        basePrice: 0,
        discountPercent: 0,
      });
      await reloadHotels();
    } catch (err) {
      setMessage(err?.response?.data?.error || "Failed to create hotel");
    }
  };

  const deleteHotelHandler = async (id) => {
    setMessage("");
    try {
      await hotelService.deleteHotel(id);
      setMessage("Hotel deleted");
      await reloadHotels();
    } catch (err) {
      setMessage(err?.response?.data?.error || "Failed to delete hotel");
    }
  };

  const updateDiscountHandler = async (id) => {
    const value = window.prompt("Enter discount percent (0-90):", "10");
    if (value === null) {
      return;
    }
    setMessage("");
    try {
      await hotelService.updateDiscount(id, Number(value));
      setMessage("Discount updated");
      await reloadHotels();
    } catch (err) {
      setMessage(err?.response?.data?.error || "Failed to update discount");
    }
  };

  const updatePricingHandler = async (id) => {
    const price = window.prompt("Enter new booking base price:", "100");
    if (price === null) {
      return;
    }
    setMessage("");
    try {
      await hotelService.updatePricing(id, { price: Number(price) });
      setMessage("Booking price updated");
      await reloadHotels();
    } catch (err) {
      setMessage(err?.response?.data?.error || "Failed to update price");
    }
  };

  const bookingStatusChartData = useMemo(() => {
    const rows = Array.isArray(analytics?.bookingsByStatus)
      ? analytics.bookingsByStatus
      : [];

    return {
      labels: rows.map((item) => item.status),
      datasets: [
        {
          label: "Bookings",
          data: rows.map((item) => item.count),
          backgroundColor: ["#4d6a57", "#e7684f", "#bf7f4f", "#1f252f"],
          borderWidth: 0,
        },
      ],
    };
  }, [analytics]);

  if (loading) {
    return (
      <section className="container-pad py-10">Loading analytics...</section>
    );
  }

  if (error) {
    return (
      <section className="container-pad py-10 text-red-700">{error}</section>
    );
  }

  const totals = analytics?.totals || {
    totalBookings: 0,
    totalHotels: 0,
    totalRevenue: 0,
  };

  const monthlyRevenue = Array.isArray(analytics?.monthlyRevenue)
    ? analytics.monthlyRevenue
    : [];

  const topRatedHotels = Array.isArray(analytics?.topRatedHotels)
    ? analytics.topRatedHotels
    : [];

  const mostBookedHotels = Array.isArray(analytics?.mostBookedHotels)
    ? analytics.mostBookedHotels
    : [];

  return (
    <section className="container-pad py-10">
      <div className="mb-6">
        <h1 className="font-display text-4xl">Admin Analytics Dashboard</h1>
        <p className="text-brand-ink/75">
          Monitor platform metrics and booking trends.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="rounded-xl bg-brand-ink px-3 py-2 text-sm font-medium text-white">
          Analytics
        </span>
        <button
          className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
            isHotelsOpen
              ? "bg-brand-coral text-white"
              : "bg-white/70 text-brand-ink hover:bg-white"
          }`}
          onClick={() => setIsHotelsOpen((prev) => !prev)}
          type="button"
        >
          Hotels {isHotelsOpen ? "-" : "+"}
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard title="Total bookings" value={totals.totalBookings} />
        <StatCard title="Total hotels" value={totals.totalHotels} />
        <StatCard title="Revenue" value={toCurrency(totals.totalRevenue)} />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <h2 className="mb-3 font-semibold">
            Revenue and bookings by month (Recharts)
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="revenue"
                  fill="#4d6a57"
                  name="Revenue"
                />
                <Bar
                  yAxisId="right"
                  dataKey="bookings"
                  fill="#e7684f"
                  name="Bookings"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-4">
          <h2 className="mb-3 font-semibold">Bookings by status (Chart.js)</h2>
          <div className="mx-auto h-80 max-w-sm">
            <Doughnut data={bookingStatusChartData} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <h2 className="mb-3 font-semibold">Top rated hotels</h2>
          <div className="space-y-2 text-sm">
            {topRatedHotels.length === 0 ? (
              <p className="text-brand-ink/70">No data available.</p>
            ) : (
              topRatedHotels.map((hotel) => (
                <div
                  key={hotel._id}
                  className="flex items-center justify-between rounded-xl bg-white/60 p-3"
                >
                  <span>{hotel.name}</span>
                  <span className="font-medium">
                    {hotel.averageRating || 0} / 5
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel p-4">
          <h2 className="mb-3 font-semibold">Most booked hotels</h2>
          <div className="space-y-2 text-sm">
            {mostBookedHotels.length === 0 ? (
              <p className="text-brand-ink/70">No data available.</p>
            ) : (
              mostBookedHotels.map((hotel) => (
                <div key={hotel.hotelId} className="rounded-xl bg-white/60 p-3">
                  <div className="flex items-center justify-between">
                    <span>{hotel.hotelName}</span>
                    <span className="font-medium">
                      {hotel.bookingsCount} bookings
                    </span>
                  </div>
                  <p className="mt-1 text-brand-ink/70">
                    Revenue: {toCurrency(hotel.revenue)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isHotelsOpen && (
        <div className="mt-6 panel p-4">
          <h2 className="mb-3 font-semibold">Hotel Management (Admin)</h2>
          {message && (
            <p className="mb-3 text-sm text-brand-coral">{message}</p>
          )}

          <form
            className="grid gap-3 md:grid-cols-4"
            onSubmit={createHotelHandler}
          >
            <input
              className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-sm"
              placeholder="Hotel name"
              value={hotelForm.name}
              onChange={(e) =>
                setHotelForm((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
            <input
              className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-sm"
              placeholder="City"
              value={hotelForm.city}
              onChange={(e) =>
                setHotelForm((prev) => ({ ...prev, city: e.target.value }))
              }
              required
            />
            <input
              className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-sm"
              placeholder="Country"
              value={hotelForm.country}
              onChange={(e) =>
                setHotelForm((prev) => ({
                  ...prev,
                  country: e.target.value,
                }))
              }
              required
            />
            <input
              type="number"
              className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-sm"
              placeholder="Base Price"
              value={hotelForm.basePrice}
              onChange={(e) =>
                setHotelForm((prev) => ({
                  ...prev,
                  basePrice: e.target.value,
                }))
              }
            />
            <input
              className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-sm md:col-span-2"
              placeholder="Description"
              value={hotelForm.description}
              onChange={(e) =>
                setHotelForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              required
            />
            <input
              type="number"
              min="1"
              max="5"
              className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-sm"
              placeholder="Star Rating"
              value={hotelForm.starRating}
              onChange={(e) =>
                setHotelForm((prev) => ({
                  ...prev,
                  starRating: e.target.value,
                }))
              }
            />
            <input
              type="number"
              min="0"
              max="90"
              className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-sm"
              placeholder="Discount %"
              value={hotelForm.discountPercent}
              onChange={(e) =>
                setHotelForm((prev) => ({
                  ...prev,
                  discountPercent: e.target.value,
                }))
              }
            />
            <button className="btn-primary md:col-span-4" type="submit">
              Add Hotel
            </button>
          </form>

          <div className="mt-4 space-y-2">
            {hotels.length === 0 ? (
              <p className="text-sm text-brand-ink/70">No hotels available.</p>
            ) : (
              hotels.map((hotel) => (
                <div
                  key={hotel._id}
                  className="rounded-xl border border-brand-ink/10 bg-white/70 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{hotel.name}</p>
                      <p className="text-xs text-brand-ink/70">
                        {hotel.address?.city}, {hotel.address?.country} | Base:{" "}
                        {toCurrency(hotel.basePrice || 0)} | Discount:{" "}
                        {hotel.discountPercent || 0}%
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={() => updatePricingHandler(hotel._id)}
                      >
                        Update Price
                      </button>
                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={() => updateDiscountHandler(hotel._id)}
                      >
                        Discount
                      </button>
                      <button
                        className="btn-primary"
                        type="button"
                        onClick={() => deleteHotelHandler(hotel._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminAnalytics;
