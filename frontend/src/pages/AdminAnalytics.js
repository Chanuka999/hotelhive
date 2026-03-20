import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
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

import adminHero from "../assets/admin_hero.png";

function StatCard({ title, value, icon, colorClass = "bg-brand-ink" }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-brand-ink/5 bg-white/40 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-700/50 dark:bg-slate-800/60">
      <div
        className={`absolute right-0 top-0 h-32 w-32 -translate-y-6 translate-x-6 rounded-full opacity-5 ${colorClass}`}
      />
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-1 font-display text-3xl font-bold tracking-tight text-brand-ink dark:text-slate-50">
            {value}
          </p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg shadow-black/10 transition group-hover:scale-110 ${colorClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function AdminAnalytics() {
  const location = useLocation();
  const [analytics, setAnalytics] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isHotelsOpen, setIsHotelsOpen] = useState(
    new URLSearchParams(location.search).get("tab") === "hotels",
  );

  useEffect(() => {
    setIsHotelsOpen(new URLSearchParams(location.search).get("tab") === "hotels");
  }, [location.search]);
  const [hotelForm, setHotelForm] = useState({
    name: "",
    description: "",
    city: "",
    country: "",
    starRating: 3,
    basePrice: 0,
    discountPercent: 0,
    image: null,
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
    const formData = new FormData();
    formData.append("name", hotelForm.name);
    formData.append("description", hotelForm.description);
    formData.append("starRating", hotelForm.starRating);
    formData.append("basePrice", hotelForm.basePrice);
    formData.append("discountPercent", hotelForm.discountPercent);
    formData.append("address[city]", hotelForm.city);
    formData.append("address[country]", hotelForm.country);
    
    if (hotelForm.image) {
      formData.append("images", hotelForm.image);
    }

    try {
      await hotelService.createHotel(formData);
      setMessage("Hotel collection updated successfully.");
      setHotelForm({
        name: "",
        description: "",
        city: "",
        country: "",
        starRating: 3,
        basePrice: 0,
        discountPercent: 0,
        image: null,
      });
      await reloadHotels();
    } catch (err) {
      setMessage(err?.response?.data?.error || "Failed to finalize property additions.");
    }
  };

  const deleteHotelHandler = async (id) => {
    setMessage("");
    try {
      await hotelService.deleteHotel(id);
      setMessage("Inventory record archived.");
      await reloadHotels();
    } catch (err) {
      setMessage(err?.response?.data?.error || "Archive synchronization failure.");
    }
  };

  const updateDiscountHandler = async (id) => {
    const value = window.prompt("Adjust property discount rate (0-90):", "10");
    if (value === null) {
      return;
    }
    setMessage("");
    try {
      await hotelService.updateDiscount(id, Number(value));
      setMessage("Promotional rate synchronized.");
      await reloadHotels();
    } catch (err) {
      setMessage(err?.response?.data?.error || "Failed to sync promotion.");
    }
  };

  const updatePricingHandler = async (id) => {
    const price = window.prompt("Specify new portfolio base valuation:", "100");
    if (price === null) {
      return;
    }
    setMessage("");
    try {
      await hotelService.updatePricing(id, { price: Number(price) });
      setMessage("Valuation metrics updated.");
      await reloadHotels();
    } catch (err) {
      setMessage(err?.response?.data?.error || "Valuation update failed.");
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
          backgroundColor: ["#ee684f", "#1f252f", "#4d6a57", "#bf7f4f"],
          borderWidth: 0,
          hoverOffset: 12
        },
      ],
    };
  }, [analytics]);

  if (loading) {
    return (
      <section className="flex flex-col items-center justify-center p-24 text-center">
        <div className="relative h-20 w-20">
          <div className="absolute inset-0 animate-ping rounded-full border-2 border-brand-coral opacity-25" />
          <div className="absolute inset-4 animate-spin rounded-full border-4 border-brand-coral border-t-transparent" />
        </div>
        <p className="mt-8 text-sm font-bold uppercase tracking-widest text-brand-ink/40 dark:text-slate-500">
          Initializing Management Node...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="p-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100/50 text-red-600 dark:bg-red-900/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-bold dark:text-white">Node Error</h2>
        <p className="mt-1 font-medium text-red-600/60">{error}</p>
      </section>
    );
  }

  const totals = analytics?.totals || {
    totalBookings: 0,
    totalHotels: 0,
    totalCustomers: 0,
    totalRooms: 0,
    totalRevenue: 0,
  };

  const revenueStats = analytics?.revenueStats || {
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
    revenueGrowthPercent: 0,
    averageBookingValue: 0,
    occupancyRate: 0,
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
    <section>
      {/* Admin Hero Section */}
      <div className="relative overflow-hidden bg-brand-ink py-16 text-white lg:py-24">
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={adminHero} 
            alt="Hero Background" 
            className="h-full w-full object-cover opacity-50 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-ink via-brand-ink/90 to-transparent" />
        </div>

        <div className="relative z-10 px-8 lg:px-12">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 rounded-full bg-brand-coral/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-coral border border-brand-coral/20">
                <div className="h-1.5 w-1.5 rounded-full bg-brand-coral animate-pulse" />
                Command Center Active
              </span>
            </div>
            <h1 className="mt-6 font-display text-5xl font-bold tracking-tight lg:text-7xl">
              Hello, <span className="italic text-brand-coral">Admin</span>
            </h1>
            <p className="mt-4 text-lg text-white/70 max-w-xl">
              Welcome back to your central property intelligence hub. You have <span className="text-white font-bold">{totals.totalBookings} active reservations</span> to monitor today.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <button 
                onClick={() => setIsHotelsOpen(false)}
                className={`flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold transition-all ${
                  !isHotelsOpen 
                    ? "bg-brand-coral text-white shadow-lg shadow-brand-coral/20 ring-4 ring-brand-coral/10" 
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                Operational Analytics
              </button>
              <button 
                onClick={() => setIsHotelsOpen(true)}
                className={`flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold transition-all ${
                  isHotelsOpen 
                    ? "bg-brand-coral text-white shadow-lg shadow-brand-coral/20 ring-4 ring-brand-coral/10" 
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                Portfolio Properties
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-12 md:px-10 lg:px-16">
        <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            title="Bookings"
            value={totals.totalBookings}
            colorClass="bg-brand-coral"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
            }
          />
          <StatCard
            title="Properties"
            value={totals.totalHotels}
            colorClass="bg-indigo-500"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            }
          />
          <StatCard
            title="Live Rooms"
            value={totals.totalRooms}
            colorClass="bg-blue-500"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v16M2 8h18M2 12h18M2 16h18M22 4v16" /></svg>
            }
          />
          <StatCard
            title="Customers"
            value={totals.totalCustomers}
            colorClass="bg-emerald-500"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><circle cx="19" cy="11" r="2" /></svg>
            }
          />
          <StatCard
            title="Revenue"
            value={toCurrency(totals.totalRevenue)}
            colorClass="bg-slate-800"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
            }
          />
        </div>

        {!isHotelsOpen ? (
          <>
            <div className="mb-10 rounded-3xl border border-brand-ink/5 bg-slate-50 p-6 dark:bg-slate-900/30">
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <h2 className="text-xl font-bold tracking-tight text-brand-ink dark:text-slate-100">
                  Revenue <span className="text-brand-coral">Insights</span>
                </h2>
                <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm dark:bg-slate-800">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Live Updates</span>
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md dark:bg-slate-800/50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 dark:text-slate-500">This month</p>
                  <p className="mt-1 text-2xl font-bold text-brand-ink dark:text-slate-100">{toCurrency(revenueStats.thisMonthRevenue)}</p>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md dark:bg-slate-800/50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 dark:text-slate-500">Last month</p>
                  <p className="mt-1 text-2xl font-bold text-brand-ink dark:text-slate-100">{toCurrency(revenueStats.lastMonthRevenue)}</p>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md dark:bg-slate-800/50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 dark:text-slate-500">Growth</p>
                  <p className={`mt-1 text-2xl font-bold ${revenueStats.revenueGrowthPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {revenueStats.revenueGrowthPercent > 0 ? '+' : ''}{revenueStats.revenueGrowthPercent}%
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md dark:bg-slate-800/50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 dark:text-slate-500">Avg booking</p>
                  <p className="mt-1 text-2xl font-bold text-brand-ink dark:text-slate-100">{toCurrency(revenueStats.averageBookingValue)}</p>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md dark:bg-slate-800/50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 dark:text-slate-500">Occupancy</p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1 overflow-hidden rounded-full bg-slate-100 h-2 dark:bg-slate-700">
                      <div className="bg-brand-coral h-full rounded-full transition-all duration-1000" style={{ width: `${revenueStats.occupancyRate}%` }} />
                    </div>
                    <span className="text-sm font-bold text-brand-ink dark:text-slate-100">{revenueStats.occupancyRate}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-10 grid gap-8 lg:grid-cols-2">
              <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-800/40">
                <h2 className="mb-6 text-lg font-bold text-brand-ink dark:text-slate-100">Financial Performance</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyRevenue}>
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <YAxis yAxisId="left" hide />
                      <YAxis yAxisId="right" orientation="right" hide />
                      <Tooltip cursor={{ fill: 'rgba(238, 104, 79, 0.05)' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                      <Bar yAxisId="left" dataKey="revenue" fill="#1f252f" radius={[6, 6, 0, 0]} name="Revenue" barSize={32} />
                      <Bar yAxisId="right" dataKey="bookings" fill="#ee684f" radius={[6, 6, 0, 0]} name="Bookings" barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-800/40">
                <h2 className="mb-6 text-lg font-bold text-brand-ink dark:text-slate-100">Booking Distribution</h2>
                <div className="mx-auto flex h-80 max-w-sm flex-col items-center justify-center">
                  <Doughnut 
                    data={bookingStatusChartData} 
                    options={{
                      cutout: '75%',
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: { usePointStyle: true, padding: 20, font: { family: 'inherit', weight: 'bold', size: 10 } }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <h2 className="mb-4 flex items-center justify-between text-lg font-bold text-brand-ink dark:text-slate-100">
                  <span>Top Rated <span className="text-brand-coral">Hotels</span></span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-coral" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                </h2>
                <div className="space-y-3">
                  {topRatedHotels.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-brand-ink/10 p-8 text-center text-sm italic text-brand-ink/40">No ratings data yet.</div>
                  ) : (
                    topRatedHotels.map((hotel, idx) => (
                      <div key={hotel._id} className="group flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-xs font-bold text-brand-ink/30 dark:bg-slate-700/50 dark:text-slate-500">{idx + 1}</span>
                          <span className="font-semibold">{hotel.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full bg-brand-coral/10 px-3 py-1 text-sm font-bold text-brand-coral">
                          <span>{hotel.averageRating?.toFixed(1) || "5.0"}</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h2 className="mb-4 flex items-center justify-between text-lg font-bold text-brand-ink dark:text-slate-100">
                  <span>Demand <span className="text-brand-coral">Leaders</span></span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </h2>
                <div className="space-y-3">
                  {mostBookedHotels.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-brand-ink/10 p-8 text-center text-sm italic text-brand-ink/40">Waiting for first bookings.</div>
                  ) : (
                    mostBookedHotels.map((hotel, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-slate-800/50">
                        <div>
                          <p className="font-semibold">{hotel.hotelName}</p>
                          <p className="text-[10px] uppercase tracking-widest text-brand-ink/40 dark:text-slate-500 mt-1">Revenue: {toCurrency(hotel.revenue)}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold text-brand-ink dark:text-slate-100">{hotel.bookingsCount}</span>
                          <span className="ml-1 text-[10px] font-bold uppercase text-brand-ink/30 dark:text-slate-500">Bookings</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-5xl">
            <div className="panel mb-10 p-6 lg:p-8">
              <h2 className="mb-6 text-2xl font-bold tracking-tight text-brand-ink dark:text-slate-100 italic">Create New <span className="text-brand-coral">Property</span></h2>
              {message && (
                <div className="mb-6 flex items-center gap-3 rounded-2xl bg-brand-coral/5 p-4 text-sm font-semibold text-brand-coral border border-brand-coral/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                  {message}
                </div>
              )}
              <form className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" onSubmit={createHotelHandler}>
                <div className="lg:col-span-2">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 dark:text-slate-500">Hotel Name</label>
                  <input className="w-full rounded-2xl border border-brand-ink/10 bg-slate-50 px-4 py-3 text-sm focus:border-brand-coral focus:ring-0 dark:border-slate-700 dark:bg-slate-900/50" placeholder="e.g. Grand Horizon Resort" value={hotelForm.name} onChange={(e) => setHotelForm((prev) => ({ ...prev, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 dark:text-slate-500">Base Price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/40">$</span>
                    <input type="number" className="w-full rounded-2xl border border-brand-ink/10 bg-slate-50 pl-8 pr-4 py-3 text-sm focus:border-brand-coral focus:ring-0 dark:border-slate-700 dark:bg-slate-900/50" placeholder="0.00" value={hotelForm.basePrice} onChange={(e) => setHotelForm((prev) => ({ ...prev, basePrice: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 dark:text-slate-500">City</label>
                  <input className="w-full rounded-2xl border border-brand-ink/10 bg-slate-50 px-4 py-3 text-sm focus:border-brand-coral focus:ring-0 dark:border-slate-700 dark:bg-slate-900/50" placeholder="City" value={hotelForm.city} onChange={(e) => setHotelForm((prev) => ({ ...prev, city: e.target.value }))} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 dark:text-slate-500">Country</label>
                  <input className="w-full rounded-2xl border border-brand-ink/10 bg-slate-50 px-4 py-3 text-sm focus:border-brand-coral focus:ring-0 dark:border-slate-700 dark:bg-slate-900/50" placeholder="Country" value={hotelForm.country} onChange={(e) => setHotelForm((prev) => ({ ...prev, country: e.target.value }))} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 dark:text-slate-500">Star Rating</label>
                  <select className="w-full rounded-2xl border border-brand-ink/10 bg-slate-50 px-4 py-3 text-sm focus:border-brand-coral focus:ring-0 dark:border-slate-700 dark:bg-slate-900/50" value={hotelForm.starRating} onChange={(e) => setHotelForm((prev) => ({ ...prev, starRating: e.target.value }))}>
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Stars</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 dark:text-slate-500">Brief Description</label>
                  <textarea className="w-full rounded-2xl border border-brand-ink/10 bg-slate-50 px-4 py-3 text-sm focus:border-brand-coral focus:ring-0 dark:border-slate-700 dark:bg-slate-900/50" placeholder="Describe the property highlights..." rows={2} value={hotelForm.description} onChange={(e) => setHotelForm((prev) => ({ ...prev, description: e.target.value }))} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 dark:text-slate-500">Offer Discount (%)</label>
                  <input type="number" className="w-full rounded-2xl border border-brand-ink/10 bg-slate-50 px-4 py-3 text-sm focus:border-brand-coral focus:ring-0 dark:border-slate-700 dark:bg-slate-900/50" placeholder="0" value={hotelForm.discountPercent} onChange={(e) => setHotelForm((prev) => ({ ...prev, discountPercent: e.target.value }))} />
                </div>
                <div className="lg:col-span-3">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 dark:text-slate-500">Property Image</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="w-full rounded-2xl border border-dashed border-brand-ink/10 bg-slate-50 px-4 py-3 text-sm focus:border-brand-coral focus:ring-0 dark:border-slate-700 dark:bg-slate-900/50" 
                    onChange={(e) => setHotelForm((prev) => ({ ...prev, image: e.target.files[0] }))} 
                  />
                  {hotelForm.image && (
                    <p className="mt-2 text-[10px] font-bold text-brand-coral uppercase tracking-widest italic">
                      Selected: {hotelForm.image.name}
                    </p>
                  )}
                </div>
                <button className="btn-primary flex items-center justify-center gap-2 py-4 lg:col-span-3" type="submit">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                  Initialize Portfolio Property
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-brand-ink/40 dark:text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                Current Managed Inventory
              </h3>
              {hotels.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-brand-ink/10 p-12 text-center text-brand-ink/30">No hotels in database.</div>
              ) : (
                hotels.map((hotel) => (
                  <div key={hotel._id} className="panel group flex flex-col gap-6 p-4 md:flex-row md:items-center">
                    <div className="h-24 w-full shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900 md:h-28 md:w-32 lg:h-32 lg:w-40">
                      {hotel.images?.[0]?.url ? (
                        <img src={hotel.images[0].url} alt={hotel.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                      ) : (
                        <img src={`https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400&h=300&sig=${hotel._id}`} alt={hotel.name} className="h-full w-full object-cover opacity-50 transition duration-500 group-hover:scale-110" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-lg font-bold text-brand-ink dark:text-slate-100">{hotel.name}</h4>
                        <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-brand-ink/40 dark:bg-slate-700 dark:text-slate-400">{hotel.starRating} Stars</span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-brand-ink/50 dark:text-slate-400">{hotel.address?.city}, {hotel.address?.country}</p>
                      <div className="mt-3 flex flex-wrap gap-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-brand-ink/30 dark:text-slate-500">Base Price</span>
                          <span className="text-sm font-bold text-brand-ink dark:text-slate-200">{toCurrency(hotel.basePrice || 0)}</span>
                        </div>
                        <div className="flex flex-col border-l border-brand-ink/5 pl-4 dark:border-slate-700">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-brand-ink/30 dark:text-slate-500">Discount</span>
                          <span className="text-sm font-bold text-brand-coral">{hotel.discountPercent || 0}% OFF</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded-xl border border-brand-ink/10 bg-white px-4 py-2 text-xs font-bold transition hover:border-brand-ink/20 hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/50" type="button" onClick={() => updatePricingHandler(hotel._id)}>Pricing</button>
                      <button className="rounded-xl border border-brand-ink/10 bg-white px-4 py-2 text-xs font-bold transition hover:border-brand-ink/20 hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/50" type="button" onClick={() => updateDiscountHandler(hotel._id)}>Promotions</button>
                      <button className="rounded-xl bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 active:scale-95 dark:bg-red-900/10 dark:hover:bg-red-900/20" type="button" onClick={() => deleteHotelHandler(hotel._id)}>Archive PDI</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default AdminAnalytics;
