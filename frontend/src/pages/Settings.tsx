import { LogOut, Moon, Bell, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Settings</h1>
        <p className="text-sm text-stone-500">Manage your profile and preferences</p>
      </div>

      <Card className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-600">
          <UserIcon size={22} />
        </div>
        <div>
          <p className="font-medium text-stone-900">{user?.email}</p>
          <p className="text-xs text-stone-500">
            Member since{" "}
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN") : "—"}
          </p>
        </div>
      </Card>

      <Card className="flex items-center justify-between opacity-60">
        <div className="flex items-center gap-3">
          <Moon size={18} className="text-stone-500" />
          <div>
            <p className="text-sm font-medium text-stone-800">Theme</p>
            <p className="text-xs text-stone-500">Coming soon</p>
          </div>
        </div>
        <span className="rounded-full bg-stone-100 px-2 py-1 text-xs text-stone-500">Soon</span>
      </Card>

      <Card className="flex items-center justify-between opacity-60">
        <div className="flex items-center gap-3">
          <Bell size={18} className="text-stone-500" />
          <div>
            <p className="text-sm font-medium text-stone-800">Notifications</p>
            <p className="text-xs text-stone-500">Coming soon</p>
          </div>
        </div>
        <span className="rounded-full bg-stone-100 px-2 py-1 text-xs text-stone-500">Soon</span>
      </Card>

      <Button variant="danger" onClick={handleLogout} className="w-fit">
        <LogOut size={16} />
        Logout
      </Button>
    </div>
  );
};
