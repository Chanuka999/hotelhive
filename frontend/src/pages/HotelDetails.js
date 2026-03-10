import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { fetchHotelById } from "../redux/slices/hotelSlice";

function HotelDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { selectedHotel, loading } = useSelector((state) => state.hotels);

  useEffect(() => {
    dispatch(fetchHotelById(id));
  }, [dispatch, id]);

  if (loading || !selectedHotel) {
    return <LoadingSpinner />;
  }

  return (
    <section className="container-pad py-10">
      <article className="panel overflow-hidden">
        <div className="h-56 bg-gradient-to-r from-brand-clay to-brand-moss" />
        <div className="space-y-4 p-6 md:p-8">
          <h1 className="font-display text-4xl">{selectedHotel.name}</h1>
          <p className="text-brand-ink/80">{selectedHotel.description}</p>
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <p>City: {selectedHotel.address?.city || "N/A"}</p>
            <p>Country: {selectedHotel.address?.country || "N/A"}</p>
            <p>
              Rating:{" "}
              {selectedHotel.averageRating || selectedHotel.starRating || 0}
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Link
              to={`/booking/${selectedHotel._id || id}`}
              className="btn-primary"
            >
              Book Now
            </Link>
            <Link to="/hotels" className="btn-secondary">
              Back to Hotels
            </Link>
          </div>
        </div>
      </article>
    </section>
  );
}

export default HotelDetails;
