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
  LineChart,
  Line,
} from "recharts";
import adminService from "../services/adminService";
import { toCurrency } from "../utils/format";

function ReportCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-brand-ink/10 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/60">
      <p className="text-xs uppercase tracking-wide text-brand-ink/65 dark:text-slate-300">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function AdminReports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const data = await adminService.getReports();
        setReports(data || {});
      } catch (err) {
        setError(err?.response?.data?.error || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const revenue = reports?.revenue || {
    totalRevenue: 0,
    monthlyRevenue: [],
    revenueByHotel: [],
  };

  const occupancy = reports?.occupancy || {
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    occupancyRate: 0,
    occupancyByHotel: [],
  };

  const bookingTrends = reports?.bookingTrends || {
    statusBreakdown: [],
    monthly: [],
  };

  const totalBookings = useMemo(
    () =>
      (Array.isArray(bookingTrends.statusBreakdown)
        ? bookingTrends.statusBreakdown
        : []
      ).reduce((sum, row) => sum + (row.count || 0), 0),
    [bookingTrends.statusBreakdown],
  );

  if (loading) {
    return (
      <section className="container-pad py-10">Loading reports...</section>
    );
  }

  if (error) {
    return (
      <section className="container-pad py-10 text-red-700">{error}</section>
    );
  }

  return (
    <section className="container-pad py-10">
      <div className="mb-6">
        <h1 className="font-display text-4xl">Admin Reports & Analytics</h1>
        <p className="text-brand-ink/75 dark:text-slate-300">
          Revenue reports, occupancy reports, and booking trends.
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <ReportCard
          label="Total Revenue"
          value={toCurrency(revenue.totalRevenue)}
        />
        <ReportCard label="Total Bookings" value={totalBookings} />
        <ReportCard label="Rooms Occupied" value={occupancy.occupiedRooms} />
        <ReportCard
          label="Occupancy Rate"
          value={`${occupancy.occupancyRate}%`}
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <h2 className="mb-3 font-semibold">Revenue Report (Monthly)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={
                  Array.isArray(revenue.monthlyRevenue)
                    ? revenue.monthlyRevenue
                    : []
                }
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#4d6a57" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-4">
          <h2 className="mb-3 font-semibold">Booking Trends (Monthly)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={
                  Array.isArray(bookingTrends.monthly)
                    ? bookingTrends.monthly
                    : []
                }
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalBookings"
                  stroke="#e7684f"
                  name="Bookings"
                />
                <Line
                  type="monotone"
                  dataKey="roomsRequested"
                  stroke="#4d6a57"
                  name="Rooms Requested"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <h2 className="mb-3 font-semibold">Occupancy Report (By Hotel)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={
                  Array.isArray(occupancy.occupancyByHotel)
                    ? occupancy.occupancyByHotel
                    : []
                }
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="hotelName"
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="occupancyRate"
                  fill="#bf7f4f"
                  name="Occupancy %"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-4">
          <h2 className="mb-3 font-semibold">Booking Status Breakdown</h2>
          <div className="space-y-2 text-sm">
            {(Array.isArray(bookingTrends.statusBreakdown)
              ? bookingTrends.statusBreakdown
              : []
            ).map((item) => (
              <div
                key={item.status}
                className="flex items-center justify-between rounded-xl bg-white/60 p-3 dark:bg-slate-900/55"
              >
                <span className="capitalize">{item.status}</span>
                <span className="font-medium">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel p-4">
        <h2 className="mb-3 font-semibold">Top Revenue Hotels</h2>
        <div className="space-y-2 text-sm">
          {(Array.isArray(revenue.revenueByHotel)
            ? revenue.revenueByHotel
            : []
          ).map((row) => (
            <div
              key={row.hotelId}
              className="rounded-xl bg-white/60 p-3 dark:bg-slate-900/55"
            >
              <div className="flex items-center justify-between">
                <span>{row.hotelName}</span>
                <span className="font-medium">{toCurrency(row.revenue)}</span>
              </div>
              <p className="mt-1 text-brand-ink/70 dark:text-slate-300">
                {row.bookings} bookings
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AdminReports;
