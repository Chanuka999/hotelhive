import { useEffect, useMemo, useState } from "react";
import adminService from "../services/adminService";
import { formatDate } from "../utils/format";

function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const rows = await adminService.getCustomers();
      setCustomers(Array.isArray(rows) ? rows : []);
    } catch (error) {
      setMessage(error?.response?.data?.error || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return customers;
    }

    return customers.filter((customer) => {
      const name = String(customer.name || "").toLowerCase();
      const email = String(customer.email || "").toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [customers, search]);

  const toggleBlock = async (customer) => {
    try {
      setMessage("");
      const updated = await adminService.blockCustomer(
        customer._id,
        !customer.isBlocked,
      );
      setCustomers((current) =>
        current.map((item) =>
          item._id === customer._id ? { ...item, ...updated } : item,
        ),
      );
      setMessage(
        customer.isBlocked ? "Customer unblocked" : "Customer blocked",
      );
    } catch (error) {
      setMessage(error?.response?.data?.error || "Failed to update customer");
    }
  };

  const removeCustomer = async (customer) => {
    const shouldDelete = window.confirm(
      `Delete customer account for ${customer.name || customer.email}?`,
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setMessage("");
      await adminService.deleteCustomer(customer._id);
      setCustomers((current) =>
        current.filter((item) => item._id !== customer._id),
      );
      setMessage("Customer deleted");
    } catch (error) {
      setMessage(error?.response?.data?.error || "Failed to delete customer");
    }
  };

  return (
    <section className="container-pad py-10">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-4xl">Admin Customer Management</h1>
          <p className="text-brand-ink/75 dark:text-slate-300">
            View all customers, block accounts, and delete users.
          </p>
        </div>

        <div className="w-full max-w-sm">
          <label className="mb-1 block text-sm font-medium">
            Search customer
          </label>
          <input
            className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email"
            value={search}
          />
        </div>
      </div>

      {message ? (
        <div className="mb-4 rounded-2xl border border-brand-ink/10 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/60">
          {message}
        </div>
      ) : null}

      <div className="panel p-5 md:p-6">
        {loading ? (
          <p className="text-sm text-brand-ink/70 dark:text-slate-300">
            Loading customers...
          </p>
        ) : filteredCustomers.length === 0 ? (
          <p className="text-sm text-brand-ink/70 dark:text-slate-300">
            No customers found.
          </p>
        ) : (
          <div className="space-y-4">
            {filteredCustomers.map((customer) => (
              <article
                key={customer._id}
                className="rounded-2xl border border-brand-ink/10 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/65"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 text-sm">
                    <p className="text-base font-semibold">
                      {customer.name || "N/A"}
                    </p>
                    <p>Email: {customer.email || "N/A"}</p>
                    <p>Phone: {customer.phone || "N/A"}</p>
                    <p>Joined: {formatDate(customer.createdAt)}</p>
                  </div>

                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        customer.isBlocked
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {customer.isBlocked ? "Blocked" : "Active"}
                    </span>

                    <div className="flex flex-wrap gap-2">
                      <button
                        className="btn-secondary"
                        onClick={() => toggleBlock(customer)}
                        type="button"
                      >
                        {customer.isBlocked ? "Unblock" : "Block"}
                      </button>
                      <button
                        className="rounded-xl bg-brand-coral px-4 py-2 text-sm font-medium text-white"
                        onClick={() => removeCustomer(customer)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default AdminCustomers;
