import { Outlet } from "react-router-dom";

export const AuthLayout = () => {
  return (
    <div className="bg-ledger-grid flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-stone-900">
            CashFlow <span className="text-orange-600">AI</span>
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Your AI-powered personal finance copilot
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};
