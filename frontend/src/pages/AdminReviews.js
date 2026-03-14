import { useEffect, useMemo, useState } from "react";
import reviewService from "../services/reviewService";
import { formatDate } from "../utils/format";

function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const loadReviews = async () => {
    try {
      setLoading(true);
      const rows = await reviewService.getAllReviewsAdmin();
      setReviews(Array.isArray(rows) ? rows : []);
    } catch (error) {
      setMessage(error?.response?.data?.error || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const filteredReviews = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return reviews;
    }

    return reviews.filter((review) => {
      const hotelName = String(review.hotel?.name || "").toLowerCase();
      const userName = String(review.user?.name || "").toLowerCase();
      const comment = String(review.comment || "").toLowerCase();
      return (
        hotelName.includes(query) ||
        userName.includes(query) ||
        comment.includes(query)
      );
    });
  }, [reviews, search]);

  const removeReview = async (review) => {
    const shouldDelete = window.confirm(
      "Delete this review as inappropriate content?",
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setMessage("");
      await reviewService.deleteInappropriateReview(review._id);
      setReviews((current) =>
        current.filter((item) => item._id !== review._id),
      );
      setMessage("Review deleted");
    } catch (error) {
      setMessage(error?.response?.data?.error || "Failed to delete review");
    }
  };

  return (
    <section className="container-pad py-10">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-4xl">Admin Review Management</h1>
          <p className="text-brand-ink/75 dark:text-slate-300">
            View reviews and remove inappropriate user feedback.
          </p>
        </div>

        <div className="w-full max-w-sm">
          <label className="mb-1 block text-sm font-medium">
            Search reviews
          </label>
          <input
            className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by hotel, user, or comment"
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
            Loading reviews...
          </p>
        ) : filteredReviews.length === 0 ? (
          <p className="text-sm text-brand-ink/70 dark:text-slate-300">
            No reviews found.
          </p>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <article
                key={review._id}
                className="rounded-2xl border border-brand-ink/10 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/65"
              >
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {review.hotel?.name || "Unknown hotel"}
                    </p>
                    <p className="text-sm text-brand-ink/70 dark:text-slate-300">
                      By {review.user?.name || "Unknown user"} (
                      {review.user?.email || "N/A"})
                    </p>
                  </div>
                  <span className="rounded-full bg-brand-ink/10 px-3 py-1 text-xs font-semibold dark:bg-slate-700">
                    Rating: {review.rating || 0}/5
                  </span>
                </div>

                <p className="mb-3 text-sm leading-relaxed">{review.comment}</p>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-brand-ink/65 dark:text-slate-400">
                    Posted: {formatDate(review.createdAt)}
                  </p>

                  <button
                    className="rounded-xl bg-brand-coral px-4 py-2 text-sm font-medium text-white"
                    onClick={() => removeReview(review)}
                    type="button"
                  >
                    Delete Review
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

export default AdminReviews;
