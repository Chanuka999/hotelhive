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

  const rooms = Array.isArray(selectedHotel.rooms) ? selectedHotel.rooms : [];

  return (
    <section className="container-pad py-10">
      <article className="panel overflow-hidden">
        <div className="h-64 overflow-hidden relative">
          {selectedHotel.images?.[0]?.url ? (
            <img 
              src={selectedHotel.images[0].url} 
              alt={selectedHotel.name} 
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-brand-clay to-brand-moss relative overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1200" 
                alt="Banner Placeholder" 
                className="h-full w-full object-cover opacity-50 mix-blend-overlay"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-ink/40 to-transparent" />
            </div>
          )}
        </div>
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

          <div className="pt-4">
            <h2 className="font-display text-2xl">Available Rooms</h2>
            {rooms.length === 0 ? (
              <p className="mt-2 text-sm text-brand-ink/70">
                No active rooms currently listed for this hotel.
              </p>
            ) : (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {rooms.map((room) => (
                  <div
                    key={room._id}
                    className="rounded-2xl border border-brand-ink/10 bg-white/70 p-4 text-sm"
                  >
                    <p className="font-semibold">{room.roomType}</p>
                    <p className="mt-1 text-brand-ink/75">{room.description}</p>
                    <p className="mt-2">Price: ${room.price} / night</p>
                    <p>Availability: {room.availableRooms} rooms</p>
                    {Array.isArray(room.amenities) &&
                      room.amenities.length > 0 && (
                        <p className="mt-2 text-xs text-brand-ink/70">
                          Facilities: {room.amenities.join(", ")}
                        </p>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </article>
    </section>
  );
}

export default HotelDetails;
