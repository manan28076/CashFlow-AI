import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { AuditProvider } from "./contexts/AuditContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./layouts/AppLayout";
import { AuthLayout } from "./layouts/AuthLayout";

import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Accounts } from "./pages/Accounts";
import { Transactions } from "./pages/Transactions";
import { Categories } from "./pages/Categories";
import { Budget } from "./pages/Budget";
import { AIAssistant } from "./pages/AIAssistant";
import { AIReport } from "./pages/AIReport";
import { Settings } from "./pages/Settings";
import { Import } from "./pages/Import";
import { NotFound } from "./pages/NotFound";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AuditProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1e293b",
                color: "#f1f5f9",
                border: "1px solid #334155",
              },
            }}
          />
          <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/import" element={<Import />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/ai-report" element={<AIReport />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        </AuditProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
