import { useEffect, useMemo, useState } from "react";
import paymentService from "../services/paymentService";
import { formatDate, toCurrency } from "../utils/format";

const paymentStatuses = ["all", "pending", "paid", "refunded"];

function PaymentBadge({ status }) {
  const classes = {
    pending: "bg-amber-100 text-amber-700",
    paid: "bg-emerald-100 text-emerald-700",
    refunded: "bg-red-100 text-red-700",
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

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-brand-ink/10 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/60">
      <p className="text-xs uppercase tracking-wide text-brand-ink/65 dark:text-slate-300">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadData = async (status = statusFilter) => {
    try {
      setLoading(true);
      const [paymentRows, reportRows] = await Promise.all([
        paymentService.getAllPaymentsAdmin(status === "all" ? "" : status),
        paymentService.getFinancialReports(),
      ]);

      setPayments(Array.isArray(paymentRows) ? paymentRows : []);
      setReports(reportRows || null);
    } catch (error) {
      setMessage(error?.response?.data?.error || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const refund = async (bookingId) => {
    if (!window.confirm("Refund this payment?")) {
      return;
    }

    try {
      setMessage("");
      const updated = await paymentService.refundPayment(bookingId);
      setPayments((current) =>
        current.map((item) =>
          item._id === bookingId ? { ...item, ...updated } : item,
        ),
      );
      setMessage("Payment refunded");
      await loadData(statusFilter);
    } catch (error) {
      setMessage(error?.response?.data?.error || "Failed to refund payment");
    }
  };

  const summary = reports?.summary || {
    totalPaid: 0,
    totalRefunded: 0,
    netRevenue: 0,
  };

  const monthlyRows = useMemo(() => {
    return Array.isArray(reports?.monthly) ? reports.monthly : [];
  }, [reports]);

  return (
    <section className="container-pad py-10">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-4xl">Admin Payment Management</h1>
          <p className="text-brand-ink/75 dark:text-slate-300">
            View payments, process refunds, and track financial reports.
          </p>
        </div>

        <div className="w-full max-w-xs">
          <label className="mb-1 block text-sm font-medium">
            Filter payment status
          </label>
          <select
            className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
            onChange={(event) => {
              const status = event.target.value;
              setStatusFilter(status);
              loadData(status);
            }}
            value={statusFilter}
          >
            {paymentStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {message ? (
        <div className="mb-4 rounded-2xl border border-brand-ink/10 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/60">
          {message}
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Stat label="Total Paid" value={toCurrency(summary.totalPaid)} />
        <Stat
          label="Total Refunded"
          value={toCurrency(summary.totalRefunded)}
        />
        <Stat label="Net Revenue" value={toCurrency(summary.netRevenue)} />
      </div>

      <div className="mb-6 panel p-5 md:p-6">
        <h2 className="mb-3 text-lg font-semibold">Monthly Financial Report</h2>

        {loading ? (
          <p className="text-sm text-brand-ink/70 dark:text-slate-300">
            Loading report...
          </p>
        ) : monthlyRows.length === 0 ? (
          <p className="text-sm text-brand-ink/70 dark:text-slate-300">
            No financial data available.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-brand-ink/10 dark:border-slate-700">
                  <th className="px-2 py-2">Month</th>
                  <th className="px-2 py-2">Paid Amount</th>
                  <th className="px-2 py-2">Refunded Amount</th>
                  <th className="px-2 py-2">Paid Count</th>
                  <th className="px-2 py-2">Refund Count</th>
                </tr>
              </thead>
              <tbody>
                {monthlyRows.map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-brand-ink/5 dark:border-slate-800"
                  >
                    <td className="px-2 py-2">{row.label}</td>
                    <td className="px-2 py-2">{toCurrency(row.paid)}</td>
                    <td className="px-2 py-2">{toCurrency(row.refunded)}</td>
                    <td className="px-2 py-2">{row.paidCount || 0}</td>
                    <td className="px-2 py-2">{row.refundedCount || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel p-5 md:p-6">
        <h2 className="mb-3 text-lg font-semibold">Payments</h2>

        {loading ? (
          <p className="text-sm text-brand-ink/70 dark:text-slate-300">
            Loading payments...
          </p>
        ) : payments.length === 0 ? (
          <p className="text-sm text-brand-ink/70 dark:text-slate-300">
            No payments found.
          </p>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <article
                key={payment._id}
                className="rounded-2xl border border-brand-ink/10 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/65"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {payment.hotel?.name || "N/A"}
                    </p>
                    <p className="text-sm text-brand-ink/70 dark:text-slate-300">
                      {payment.user?.name || "Unknown user"} (
                      {payment.user?.email || "N/A"})
                    </p>
                  </div>
                  <PaymentBadge status={payment.paymentStatus || "pending"} />
                </div>

                <div className="grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-4">
                  <p>Amount: {toCurrency(payment.totalPrice || 0)}</p>
                  <p>Room: {payment.room?.roomType || "N/A"}</p>
                  <p>Payment ID: {payment.paymentInfo?.paymentId || "-"}</p>
                  <p>Method: {payment.paymentInfo?.paymentMethod || "-"}</p>
                  <p>Paid at: {formatDate(payment.paymentInfo?.paidAt)}</p>
                  <p>
                    Refunded at: {formatDate(payment.paymentInfo?.refundedAt)}
                  </p>
                  <p>Booking created: {formatDate(payment.createdAt)}</p>
                </div>

                <div className="mt-4">
                  <button
                    className="rounded-xl bg-brand-coral px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={payment.paymentStatus !== "paid"}
                    onClick={() => refund(payment._id)}
                    type="button"
                  >
                    Refund Payment
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

export default AdminPayments;
