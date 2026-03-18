import { Routes, Route } from "react-router";

// Pages
import Home from "../pages/Home";
import About from "../pages/About";
import Katalog from "../pages/Katalog";
import DetailKatalog from "../pages/KatalogDetail";
import Login from "../pages/LoginPage";
import Register from "../pages/Register";
import HandleLogout from "../pages/Handlelogout";
import SuperAdminDashboard from "../pages/dashboard/SuperAdminDashboard";
import Profile from "../pages/Profile";
import Eresource from "../pages/EResoucePage"
import MyLoans from "../pages/MyLoansPage"

// Components
import ProtectedRoute from "../components/ProtectedRoute";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/katalog" element={<Katalog />} />
      <Route path="/katalog/:id" element={<DetailKatalog />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/e-resource" element={<Eresource />} />
      <Route path="/my-loans" element={<MyLoans />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/handle" element={<HandleLogout />} />

      {/* Dashboard Routes - Protected */}
      <Route
        path="/dashboard/super-admin"
        element={
          <ProtectedRoute requiredRole="super_admin">
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* 404 Not Found */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-[#030304]">
            <div className="text-center">
              <h1 className="text-6xl font-heading font-bold gradient-text mb-4">
                404
              </h1>
              <p className="text-xl text-[#94A3B8] mb-8">Page not found</p>
              <a href="/" className="btn-primary inline-block">
                Go Home
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
