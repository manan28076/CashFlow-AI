import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-stone-50 text-center">
      <p className="text-6xl font-semibold text-orange-500">404</p>
      <h1 className="text-xl font-medium text-stone-900">Page not found</h1>
      <p className="max-w-sm text-sm text-stone-500">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/dashboard">
        <Button className="mt-2">Back to Dashboard</Button>
      </Link>
    </div>
  );
};
