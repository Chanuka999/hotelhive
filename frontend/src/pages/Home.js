import { Link } from "react-router-dom";
// Fallback image path
const HERO_IMG = "/assets/jetwing-hero.png";

const navLinks = [
  "HOME",
  "HOTELS",
  "DINING",
  "WELLNESS",
  "EVENTS",
  "WEDDINGS",
  "SUSTAINABILITY",
  "OFFERS",
  "ABOUT US",
  "FAQS",
];

const topLinks = [
  "GIFT VOUCHERS",
  "ISLAND INSIDER",
  "CAREERS",
  "+94 11 470 9400",
];

export default function Home() {
  return (
    <div
      className="relative min-h-screen bg-cover bg-center flex flex-col"
      style={{
        backgroundImage: `url('${HERO_IMG}')`,
        backgroundColor: "#e5e7eb",
      }}
    >
      {/* If image fails to load, show a warning (for dev) */}
      {!HERO_IMG && (
        <div className="bg-red-100 text-red-700 p-4 text-center">
          Hero image missing or failed to load.
        </div>
      )}
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-30 z-0" />
      {/* Top bar */}
      <div className="flex justify-end items-center gap-6 px-8 py-2 text-xs text-white relative z-10">
        {topLinks.map((item) => (
          <span key={item} className="hover:underline cursor-pointer">
            {item}
          </span>
        ))}
      </div>
      {/* Logo & Nav */}
      <div className="flex justify-between items-center px-12 py-6 relative z-10">
        <div className="flex flex-col">
          <span className="text-3xl font-serif font-bold text-white">
            Hotel <span className="font-light">HIVE</span>
          </span>
          <span className="text-xs text-white tracking-widest">SRI LANKA</span>
        </div>
        <nav>
          <ul className="flex gap-8 text-white font-semibold text-sm">
            {navLinks.map((link) => {
              if (link === "HOTELS") {
                return (
                  <li key={link}>
                    <Link
                      to="/hotels"
                      className="hover:underline cursor-pointer"
                    >
                      {link}
                    </Link>
                  </li>
                );
              } else if (link === "DINING") {
                return (
                  <li key={link}>
                    <Link
                      to="/dining"
                      className="hover:underline cursor-pointer"
                    >
                      {link}
                    </Link>
                  </li>
                );
              } else {
                return (
                  <li key={link} className="hover:underline cursor-pointer">
                    {link}
                  </li>
                );
              }
            })}
          </ul>
        </nav>
      </div>
      {/* Book Your Stay Button */}
      <div className="absolute left-8 bottom-8 z-20">
        <button className="bg-white text-gray-900 px-6 py-3 rounded-full shadow-lg font-semibold flex items-center gap-2">
          Book Your Stay
          <span className="bg-pink-600 text-white text-xs px-2 py-1 rounded-full ml-2">
            BEST RATES GUARANTEED
          </span>
        </button>
      </div>
    </div>
  );
}
