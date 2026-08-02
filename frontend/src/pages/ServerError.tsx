import { Button } from "../components/ui/Button";

export const ServerError = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-stone-50 text-center">
      <p className="text-6xl font-semibold text-red-500">500</p>
      <h1 className="text-xl font-medium text-stone-900">Something went wrong</h1>
      <p className="max-w-sm text-sm text-stone-500">
        An unexpected error occurred. Please try again in a moment.
      </p>
      <Button className="mt-2" onClick={() => window.location.reload()}>
        Reload Page
      </Button>
    </div>
  );
};
