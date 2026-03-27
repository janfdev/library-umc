import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import AppRoutes from "@/routes/index";
import { ToastProvider } from "@/context/ToastContext";
import ToastContainer from "@/components/ui/ToastContainer";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      {/* Global toast container — dirender sekali di sini */}
      <ToastContainer />
    </ToastProvider>
  </StrictMode>
);
