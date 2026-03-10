import { useState } from "react";
import DatePicker from "react-datepicker";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { createBooking } from "../redux/slices/bookingSlice";

function BookingPage() {
  const { hotelId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.bookings);

  const [checkIn, setCheckIn] = useState(new Date());
  const [checkOut, setCheckOut] = useState(new Date(Date.now() + 86400000));
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [numberOfRooms, setNumberOfRooms] = useState(1);
  const [specialRequests, setSpecialRequests] = useState("");

  const submitHandler = async (e) => {
    e.preventDefault();

    const payload = {
      hotel: hotelId,
      checkIn,
      checkOut,
      guests: {
        adults,
        children,
      },
      numberOfRooms,
      specialRequests,
    };

    const result = await dispatch(createBooking(payload));
    if (createBooking.fulfilled.match(result)) {
      navigate("/dashboard");
    }
  };

  return (
    <section className="container-pad py-10">
      <div className="mx-auto max-w-2xl panel p-6 md:p-8">
        <h1 className="font-display text-4xl">Complete Your Booking</h1>
        <p className="mt-1 text-sm text-brand-ink/75">Hotel ID: {hotelId}</p>

        <form className="mt-6 space-y-4" onSubmit={submitHandler}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Check-in</label>
              <DatePicker
                selected={checkIn}
                onChange={(date) => setCheckIn(date)}
                className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Check-out
              </label>
              <DatePicker
                selected={checkOut}
                onChange={(date) => setCheckOut(date)}
                minDate={checkIn}
                className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <input
              type="number"
              min="1"
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
              className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
              placeholder="Adults"
            />
            <input
              type="number"
              min="0"
              value={children}
              onChange={(e) => setChildren(Number(e.target.value))}
              className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
              placeholder="Children"
            />
            <input
              type="number"
              min="1"
              value={numberOfRooms}
              onChange={(e) => setNumberOfRooms(Number(e.target.value))}
              className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
              placeholder="Rooms"
            />
          </div>

          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            className="min-h-28 w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
            placeholder="Special requests"
          />

          <button
            className="btn-primary w-full"
            disabled={loading}
            type="submit"
          >
            {loading ? "Processing..." : "Confirm Booking"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default BookingPage;
