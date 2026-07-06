import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { ThemeProvider } from "next-themes";
import "./index.css";
import AppRoutes from "@/routes/index";
import { ToastProvider } from "@/context/ToastContext";
import ToastContainer from "@/components/ui/ToastContainer";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <ToastContainer />
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>
);
