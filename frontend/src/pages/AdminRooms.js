import { useEffect, useState } from "react";
import hotelService from "../services/hotelService";
import roomService from "../services/roomService";
import { toCurrency } from "../utils/format";

const roomTypes = ["Single", "Double", "Suite", "Deluxe", "Presidential"];
const bedTypes = ["Single", "Double", "Queen", "King"];

const createInitialForm = () => ({
  roomType: "Single",
  description: "",
  price: 100,
  size: 25,
  bedType: "Queen",
  capacityAdults: 2,
  capacityChildren: 0,
  amenities: "",
  totalRooms: 1,
  availableRooms: 1,
  isActive: true,
  existingImages: [],
  images: [],
});

function AdminRooms() {
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editingRoomId, setEditingRoomId] = useState("");
  const [form, setForm] = useState(createInitialForm());

  useEffect(() => {
    const loadHotels = async () => {
      try {
        setLoading(true);
        const hotelRows = await hotelService.getHotels();
        const normalizedHotels = Array.isArray(hotelRows) ? hotelRows : [];
        setHotels(normalizedHotels);
        if (normalizedHotels.length) {
          setSelectedHotelId(normalizedHotels[0]._id);
        }
      } catch (error) {
        setMessage(error?.response?.data?.error || "Failed to load hotels");
      } finally {
        setLoading(false);
      }
    };

    loadHotels();
  }, []);

  useEffect(() => {
    if (!selectedHotelId) {
      setRooms([]);
      return;
    }

    const loadRooms = async () => {
      try {
        setLoading(true);
        const roomRows = await roomService.getRoomsByHotel(selectedHotelId);
        setRooms(Array.isArray(roomRows) ? roomRows : []);
      } catch (error) {
        setMessage(error?.response?.data?.error || "Failed to load rooms");
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, [selectedHotelId]);

  const resetForm = () => {
    setEditingRoomId("");
    setForm(createInitialForm());
  };

  const refreshRooms = async (hotelId = selectedHotelId) => {
    if (!hotelId) {
      return;
    }

    const roomRows = await roomService.getRoomsByHotel(hotelId);
    setRooms(Array.isArray(roomRows) ? roomRows : []);
  };

  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target;
    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : type === "file"
            ? Array.from(files || [])
            : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedHotelId) {
      setMessage("Create a hotel first to manage rooms");
      return;
    }

    if (!form.description) {
      setMessage("Please add a description for the room.");
      setSaving(false);
      return;
    }

    setSaving(true);
    setMessage("");

    const payload = {
      roomType: form.roomType,
      description: form.description,
      price: Number(form.price),
      size: Number(form.size),
      bedType: form.bedType,
      capacityAdults: Number(form.capacityAdults),
      capacityChildren: Number(form.capacityChildren),
      amenities: form.amenities
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      totalRooms: Number(form.totalRooms),
      availableRooms: Number(form.availableRooms),
      isActive: form.isActive,
      existingImages: form.existingImages,
      images: form.images,
    };

    try {
      if (editingRoomId) {
        await roomService.updateRoom(editingRoomId, payload);
        setMessage("Room updated");
      } else {
        await roomService.createRoom(selectedHotelId, payload);
        setMessage("Room created");
      }

      resetForm();
      await refreshRooms();
    } catch (error) {
      const errorMsg = error?.response?.data?.error;
      setMessage(
        Array.isArray(errorMsg)
          ? errorMsg[0] // Take the first error if it's an array
          : errorMsg || "Failed to save room",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (room) => {
    setEditingRoomId(room._id);
    setForm({
      roomType: room.roomType || "Single",
      description: room.description || "",
      price: room.price || 0,
      size: room.size || 0,
      bedType: room.bedType || "Queen",
      capacityAdults: room.capacity?.adults || 1,
      capacityChildren: room.capacity?.children || 0,
      amenities: Array.isArray(room.amenities) ? room.amenities.join(", ") : "",
      totalRooms: room.totalRooms || 1,
      availableRooms: room.availableRooms || 0,
      isActive: room.isActive !== false,
      existingImages: Array.isArray(room.images) ? room.images : [],
      images: [],
    });
  };

  const handleDelete = async (roomId) => {
    if (!window.confirm("Delete this room?")) {
      return;
    }

    try {
      setMessage("");
      await roomService.deleteRoom(roomId);
      if (editingRoomId === roomId) {
        resetForm();
      }
      setMessage("Room deleted");
      await refreshRooms();
    } catch (error) {
      setMessage(error?.response?.data?.error || "Failed to delete room");
    }
  };

  const removeExistingImage = (publicId) => {
    setForm((current) => ({
      ...current,
      existingImages: current.existingImages.filter(
        (image) => image.public_id !== publicId,
      ),
    }));
  };

  const selectedHotel = hotels.find((hotel) => hotel._id === selectedHotelId);

  return (
    <section className="container-pad py-10">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-4xl">Admin Room Management</h1>
          <p className="text-brand-ink/75">
            Add, edit, delete, price, image, and availability data for each
            hotel room.
          </p>
        </div>

        <div className="w-full max-w-sm">
          <label className="mb-1 block text-sm font-medium">Hotel</label>
          <select
            className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
            onChange={(event) => {
              setSelectedHotelId(event.target.value);
              resetForm();
            }}
            value={selectedHotelId}
          >
            {hotels.length === 0 ? (
              <option value="">No hotels available</option>
            ) : (
              hotels.map((hotel) => (
                <option key={hotel._id} value={hotel._id}>
                  {hotel.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {message ? (
        <div className="mb-4 rounded-2xl border border-brand-ink/10 bg-white/80 px-4 py-3 text-sm">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="panel p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl">
                {editingRoomId ? "Edit room" : "Create room"}
              </h2>
              <p className="text-sm text-brand-ink/70">
                {selectedHotel ? selectedHotel.name : "Select a hotel first"}
              </p>
            </div>
            {editingRoomId ? (
              <button
                className="btn-secondary"
                onClick={resetForm}
                type="button"
              >
                Cancel edit
              </button>
            ) : null}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Room type
                </label>
                <select
                  className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
                  name="roomType"
                  onChange={handleChange}
                  value={form.roomType}
                >
                  {roomTypes.map((roomType) => (
                    <option key={roomType} value={roomType}>
                      {roomType}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Bed type
                </label>
                <select
                  className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
                  name="bedType"
                  onChange={handleChange}
                  value={form.bedType}
                >
                  {bedTypes.map((bedType) => (
                    <option key={bedType} value={bedType}>
                      {bedType}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Description
              </label>
              <textarea
                className="min-h-28 w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
                name="description"
                onChange={handleChange}
                value={form.description}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Price</label>
                <input
                  className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
                  min="0"
                  name="price"
                  onChange={handleChange}
                  type="number"
                  value={form.price}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Size (sqm)
                </label>
                <input
                  className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
                  min="1"
                  name="size"
                  onChange={handleChange}
                  type="number"
                  value={form.size}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Adults</label>
                <input
                  className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
                  min="1"
                  name="capacityAdults"
                  onChange={handleChange}
                  type="number"
                  value={form.capacityAdults}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Children
                </label>
                <input
                  className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
                  min="0"
                  name="capacityChildren"
                  onChange={handleChange}
                  type="number"
                  value={form.capacityChildren}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Total rooms
                </label>
                <input
                  className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
                  min="1"
                  name="totalRooms"
                  onChange={handleChange}
                  type="number"
                  value={form.totalRooms}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Available rooms
                </label>
                <input
                  className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
                  min="0"
                  name="availableRooms"
                  onChange={handleChange}
                  type="number"
                  value={form.availableRooms}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Amenities (comma separated)
              </label>
              <input
                className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
                name="amenities"
                onChange={handleChange}
                placeholder="WiFi, AC, Mini Bar"
                value={form.amenities}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Upload images
              </label>
              <input
                accept="image/*"
                className="w-full rounded-xl border border-dashed border-brand-ink/20 bg-white px-3 py-2"
                multiple
                name="images"
                onChange={handleChange}
                type="file"
              />
              {form.images.length ? (
                <p className="mt-2 text-sm text-brand-ink/70">
                  New files: {form.images.map((file) => file.name).join(", ")}
                </p>
              ) : null}
            </div>

            {form.existingImages.length ? (
              <div>
                <p className="mb-2 text-sm font-medium">Current images</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {form.existingImages.map((image) => (
                    <div
                      key={image.public_id}
                      className="overflow-hidden rounded-2xl border border-brand-ink/10 bg-white"
                    >
                      <img
                        alt="Room"
                        className="h-32 w-full object-cover"
                        src={image.url}
                      />
                      <button
                        className="w-full px-3 py-2 text-sm font-medium text-brand-coral"
                        onClick={() => removeExistingImage(image.public_id)}
                        type="button"
                      >
                        Remove image
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                checked={form.isActive}
                name="isActive"
                onChange={handleChange}
                type="checkbox"
              />
              Room is active for bookings
            </label>

            <button
              className="btn-primary w-full"
              disabled={saving}
              type="submit"
            >
              {saving
                ? "Saving..."
                : editingRoomId
                  ? "Update Room"
                  : "Create Room"}
            </button>
          </form>
        </div>

        <div className="panel p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl">Room inventory</h2>
              <p className="text-sm text-brand-ink/70">
                {selectedHotel ? selectedHotel.name : "No hotel selected"}
              </p>
            </div>
            <span className="rounded-full bg-brand-ink px-3 py-1 text-sm text-white">
              {rooms.length} rooms
            </span>
          </div>

          {loading ? (
            <p className="text-sm text-brand-ink/70">Loading rooms...</p>
          ) : rooms.length === 0 ? (
            <p className="text-sm text-brand-ink/70">
              No rooms found for this hotel.
            </p>
          ) : (
            <div className="space-y-4">
              {rooms.map((room) => (
                <article
                  key={room._id}
                  className="panel overflow-hidden"
                >
                  <div className="h-44 bg-brand-sand">
                    {room.images?.[0]?.url ? (
                      <img
                        alt={room.roomType}
                        className="h-full w-full object-cover"
                        src={room.images[0].url}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-brand-ink/50">
                        No image uploaded
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{room.roomType} room</h3>
                        <p className="text-sm text-brand-ink/70">
                          {room.bedType} bed
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          room.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {room.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <p className="text-sm text-brand-ink/80">
                      {room.description}
                    </p>

                    <div className="grid gap-2 text-sm md:grid-cols-2">
                      <p>Price: {toCurrency(room.price)}</p>
                      <p>Size: {room.size} sqm</p>
                      <p>
                        Capacity: {room.capacity?.adults || 0} adults,{" "}
                        {room.capacity?.children || 0} children
                      </p>
                      <p>
                        Availability: {room.availableRooms || 0} /{" "}
                        {room.totalRooms || 0}
                      </p>
                    </div>

                    {room.amenities?.length ? (
                      <p className="text-sm text-brand-ink/70">
                        Amenities: {room.amenities.join(", ")}
                      </p>
                    ) : null}

                    <div className="flex gap-2">
                      <button
                        className="btn-secondary"
                        onClick={() => handleEdit(room)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-xl bg-brand-coral px-4 py-2 font-medium text-white"
                        onClick={() => handleDelete(room._id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default AdminRooms;
