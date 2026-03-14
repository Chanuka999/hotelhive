import { Link } from "react-router-dom";

function HotelCard({ hotel }) {
  const rooms = Array.isArray(hotel.rooms) ? hotel.rooms : [];
  const totalAvailableRooms = rooms.reduce(
    (sum, room) => sum + (Number(room.availableRooms) || 0),
    0,
  );
  const minRoomPrice = rooms.length
    ? Math.min(...rooms.map((room) => Number(room.price) || 0))
    : Number(hotel.basePrice) || 0;

  return (
    <article className="panel overflow-hidden transition hover:-translate-y-1">
      <div className="h-44 bg-gradient-to-tr from-brand-moss/70 to-brand-coral/70" />
      <div className="space-y-3 p-5">
        <div>
          <h3 className="font-display text-2xl">{hotel.name}</h3>
          <p className="text-sm text-brand-ink/70">
            {hotel.address?.city || "City"},{" "}
            {hotel.address?.country || "Country"}
          </p>
        </div>
        <p className="line-clamp-2 text-sm text-brand-ink/80">
          {hotel.description}
        </p>
        <div className="rounded-xl border border-brand-ink/10 bg-white/60 p-3 text-xs text-brand-ink/80">
          <p>Rooms listed: {rooms.length}</p>
          <p>Available rooms: {totalAvailableRooms}</p>
          <p>Price from: ${minRoomPrice}</p>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Rating: {hotel.averageRating || hotel.starRating || 0}</span>
          <Link to={`/hotels/${hotel._id || "demo"}`} className="btn-secondary">
            View
          </Link>
        </div>
      </div>
    </article>
  );
}

export default HotelCard;
