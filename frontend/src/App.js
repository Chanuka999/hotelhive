import { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Hotels from "./pages/Hotels";
import HotelDetails from "./pages/HotelDetails";
import BookingPage from "./pages/BookingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminRooms from "./pages/AdminRooms";
import AdminBookings from "./pages/AdminBookings";
import AdminCustomers from "./pages/AdminCustomers";
import AdminPayments from "./pages/AdminPayments";
import AdminReviews from "./pages/AdminReviews";
import AdminStaff from "./pages/AdminStaff";
import AdminReports from "./pages/AdminReports";
import AdminSidebarLayout from "./components/layout/AdminSidebarLayout";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminRoute from "./components/common/AdminRoute";

import Dining from "./pages/Dining";

const getInitialTheme = () => {
  const saved = localStorage.getItem("theme");
  if (saved === "dark" || saved === "light") {
    return saved;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const isDark = theme === "dark";
  const location = useLocation();
  const hideLayout = ["/login", "/register"].includes(location.pathname);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", theme);
  }, [isDark, theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  return (
    <div
      className={`flex min-h-screen flex-col transition-colors duration-300 ${
        isDark ? "bg-slate-950 text-slate-100" : "bg-brand-sand text-brand-ink"
      }`}
    >
      {!hideLayout && <Navbar isDark={isDark} onToggleTheme={toggleTheme} />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/hotels/:id" element={<HotelDetails />} />
          <Route path="/dining" element={<Dining />} />
          <Route
            path="/booking/:hotelId"
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <AdminRoute>
                <AdminSidebarLayout>
                  <AdminAnalytics />
                </AdminSidebarLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/rooms"
            element={
              <AdminRoute>
                <AdminSidebarLayout>
                  <AdminRooms />
                </AdminSidebarLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <AdminRoute>
                <AdminSidebarLayout>
                  <AdminBookings />
                </AdminSidebarLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/customers"
            element={
              <AdminRoute>
                <AdminSidebarLayout>
                  <AdminCustomers />
                </AdminSidebarLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <AdminRoute>
                <AdminSidebarLayout>
                  <AdminPayments />
                </AdminSidebarLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <AdminRoute>
                <AdminSidebarLayout>
                  <AdminReviews />
                </AdminSidebarLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/staff"
            element={
              <AdminRoute>
                <AdminSidebarLayout>
                  <AdminStaff />
                </AdminSidebarLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <AdminRoute>
                <AdminSidebarLayout>
                  <AdminReports />
                </AdminSidebarLayout>
              </AdminRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!hideLayout && <Footer />}
    </div>
  );
}

export default App;
