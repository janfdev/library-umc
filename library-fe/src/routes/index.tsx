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
import Eresource from "../pages/EResoucePage";
import MyLoans from "../pages/MyLoansPage";
import NotFound from "../pages/NotFound";

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

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
