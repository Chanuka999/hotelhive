import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import HotelCard from "../components/common/HotelCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { fetchHotels, searchHotels } from "../redux/slices/hotelSlice";

function Hotels() {
  const dispatch = useDispatch();
  const { hotels, loading } = useSelector((state) => state.hotels);
  const safeHotels = Array.isArray(hotels) ? hotels : [];

  const [filters, setFilters] = useState({
    location: "",
    minRating: "",
    minPrice: "",
    maxPrice: "",
    roomType: "",
    availableOnly: true,
  });

  useEffect(() => {
    dispatch(fetchHotels());
  }, [dispatch]);

  const onFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const onSearch = (e) => {
    e.preventDefault();
    const params = Object.fromEntries(
      Object.entries(filters).filter(([key, value]) => {
        if (key === "availableOnly") {
          return Boolean(value);
        }
        return String(value).trim() !== "";
      }),
    );

    if (params.availableOnly) {
      params.availableOnly = "true";
    }

    dispatch(searchHotels(params));
  };

  const onReset = () => {
    setFilters({
      location: "",
      minRating: "",
      minPrice: "",
      maxPrice: "",
      roomType: "",
      availableOnly: true,
    });
    dispatch(fetchHotels());
  };

  return (
    <section className="container-pad py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Hotels</h1>
          <p className="text-sm text-brand-ink/75">
            Search destinations and compare available properties.
          </p>
        </div>
      </div>

      <form
        className="panel mb-6 grid gap-3 p-4 md:grid-cols-3 lg:grid-cols-4"
        onSubmit={onSearch}
      >
        <input
          className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-sm"
          name="location"
          onChange={onFilterChange}
          placeholder="Search by location"
          value={filters.location}
        />
        <input
          className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-sm"
          max="5"
          min="1"
          name="minRating"
          onChange={onFilterChange}
          placeholder="Min rating"
          type="number"
          value={filters.minRating}
        />
        <input
          className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-sm"
          min="0"
          name="minPrice"
          onChange={onFilterChange}
          placeholder="Min price"
          type="number"
          value={filters.minPrice}
        />
        <input
          className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-sm"
          min="0"
          name="maxPrice"
          onChange={onFilterChange}
          placeholder="Max price"
          type="number"
          value={filters.maxPrice}
        />
        <select
          className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-sm"
          name="roomType"
          onChange={onFilterChange}
          value={filters.roomType}
        >
          <option value="">All room types</option>
          <option value="Single">Single</option>
          <option value="Double">Double</option>
          <option value="Suite">Suite</option>
          <option value="Deluxe">Deluxe</option>
          <option value="Presidential">Presidential</option>
        </select>
        <label className="flex items-center gap-2 rounded-xl border border-brand-ink/20 bg-white px-3 py-2 text-sm">
          <input
            checked={filters.availableOnly}
            name="availableOnly"
            onChange={onFilterChange}
            type="checkbox"
          />
          Show only available rooms
        </label>
        <div className="flex gap-2">
          <button className="btn-primary flex-1" type="submit">
            Search
          </button>
          <button
            className="btn-secondary flex-1"
            onClick={onReset}
            type="button"
          >
            Reset
          </button>
        </div>
      </form>

      {loading ? (
        <LoadingSpinner />
      ) : safeHotels.length === 0 ? (
        <div className="panel p-6 text-center text-brand-ink/75">
          No hotels matched your filters.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {safeHotels.map((hotel) => (
            <HotelCard hotel={hotel} key={hotel._id || hotel.name} />
          ))}
        </div>
      )}
    </section>
  );
}

export default Hotels;
