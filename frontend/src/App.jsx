import React, { lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, PublicOnlyRoute, RootRedirect } from "./components/routing/RouteGuards";
import DashboardLayout from "./components/layouts/DashboardLayout";

import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import NotFound from "./pages/NotFound";

// Logged-in pages are loaded on demand, so the login page doesn't have to
// download the charting library first.
const Home = lazy(() => import("./pages/Dashboard/Home"));
const Income = lazy(() => import("./pages/Dashboard/Income"));
const Expense = lazy(() => import("./pages/Dashboard/Expense"));
const Reports = lazy(() => import("./pages/Dashboard/Reports"));

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* "/" sends you to the dashboard or the login page */}
          <Route path="/" element={<RootRedirect />} />

          {/* Only for logged-out visitors */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
          </Route>
          {/* Old link kept working */}
          <Route path="/signUp" element={<Navigate to="/signup" replace />} />

          {/* Only for logged-in users, all inside the sidebar layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Home />} />
              <Route path="/income" element={<Income />} />
              <Route path="/expense" element={<Expense />} />
              <Route path="/reports" element={<Reports />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { fontSize: "14px", borderRadius: "10px", color: "#101828" },
          success: { iconTheme: { primary: "#15804f", secondary: "#fff" } },
          error: { iconTheme: { primary: "#b42318", secondary: "#fff" } },
        }}
      />
    </AuthProvider>
  );
};

export default App;
