import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  LogOut,
  Moon,
  Sun,
  Bell,
  User as UserIcon,
  Check,
  Zap,
  ShieldCheck,
  CreditCard,
  Download,
  Sparkles,
  ArrowRight,
  X,
  Building2,
  Calendar,
  Layers,
  FileText,
  BadgeCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useTheme, type Theme } from "../hooks/useTheme";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { cn } from "../utils/cn";
import {
  paymentService,
  loadRazorpayScript,
  type SubscriptionPaymentRecord,
} from "../services/payment.service";
import { generateTaxInvoicePDF } from "../utils/invoiceGenerator";

export const Settings = () => {
  const { user, logout, updateUser, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // Database-backed plan is the single source of truth
  const currentPlan = ((user?.plan as string) || "STARTER").toLowerCase() as
    | "starter"
    | "pro"
    | "family";
  const [isAnnual, setIsAnnual] = useState(true);

  // Live Subscription Details from PostgreSQL
  const [subscriptionData, setSubscriptionData] = useState<{
    daysRemaining: number;
    payments: SubscriptionPaymentRecord[];
  }>({
    daysRemaining: 0,
    payments: [],
  });
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);

  // Upgrade Modal state
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedUpgradeTier, setSelectedUpgradeTier] = useState<"pro" | "family">("pro");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card">("upi");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Notification toggles
  const [notifications, setNotifications] = useState({
    budgetAlerts: true,
    weeklyReport: true,
    duplicateWarnings: true,
  });

  const fetchSubscriptionData = async () => {
    try {
      setIsLoadingSubscription(true);
      const data = await paymentService.getSubscription();
      if (data?.user) {
        updateUser(data.user);
      }
      setSubscriptionData({
        daysRemaining: data?.daysRemaining || 0,
        payments: data?.payments || [],
      });
    } catch (err) {
      console.warn("Could not fetch latest subscription data:", err);
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    toast.success(
      newTheme === "dark-blue"
        ? "Switched to Midnight Sapphire (Dark Blue) theme"
        : "Switched to Classic Ledger (Light) theme",
      { id: "theme-toast" }
    );
  };

  const handleToggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      toast.success("Notification preferences updated", { id: "notif-toast" });
      return updated;
    });
  };

  const openUpgradeModal = (tier: "pro" | "family") => {
    setSelectedUpgradeTier(tier);
    setIsUpgradeModalOpen(true);
  };

  // Legit Razorpay Payment Integration with Backend Verification
  const handleInitiateRazorpay = async () => {
    try {
      setIsProcessingPayment(true);
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        toast.error("Unable to load Razorpay checkout SDK. Please verify your connection.");
        setIsProcessingPayment(false);
        return;
      }

      const cycle = isAnnual ? "annual" : "monthly";
      const orderData = await paymentService.createOrder(selectedUpgradeTier, cycle);

      // If live Razorpay checkout is configured and window.Razorpay is present
      if (typeof (window as any).Razorpay !== "undefined" && !orderData.isTestMode) {
        const options = {
          key: orderData.keyId,
          amount: orderData.paise,
          currency: orderData.currency || "INR",
          name: "CashFlow AI",
          description: `CashFlow ${orderData.plan} Plan (${orderData.billingCycle})`,
          order_id: orderData.orderId,
          handler: async function (response: any) {
            try {
              toast.loading("Verifying cryptographic signature on backend...", { id: "payment-verify" });
              const verified = await paymentService.verifyPayment({
                razorpayOrderId: response.razorpay_order_id || orderData.orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              updateUser(verified.user);
              await fetchSubscriptionData();
              setIsUpgradeModalOpen(false);
              toast.success(`🎉 Payment verified! Welcome to CashFlow ${orderData.plan}!`, {
                id: "payment-verify",
                duration: 5000,
              });
            } catch (err: any) {
              toast.error(err.message || "Payment verification failed", { id: "payment-verify" });
            } finally {
              setIsProcessingPayment(false);
            }
          },
          prefill: {
            name: user?.name || "Subscriber",
            email: user?.email || "",
          },
          theme: {
            color: "#ea580c",
          },
          modal: {
            ondismiss: function () {
              setIsProcessingPayment(false);
              toast("Checkout window closed", { icon: "ℹ️" });
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          toast.error(`Payment failed: ${response.error?.description || "Transaction declined"}`);
          setIsProcessingPayment(false);
        });
        rzp.open();
      } else {
        // Test verification fallback for local dev when RAZORPAY_KEY_SECRET is not yet added
        toast.loading("Verifying transaction on server...", { id: "payment-verify" });
        const dummyPaymentId = `pay_rzp_test_${Date.now()}`;
        const verified = await paymentService.verifyPayment({
          razorpayOrderId: orderData.orderId,
          razorpayPaymentId: dummyPaymentId,
          razorpaySignature: "mock_verified_signature",
        });
        updateUser(verified.user);
        await fetchSubscriptionData();
        setIsUpgradeModalOpen(false);
        toast.success(`🎉 Payment verified! You are now on CashFlow ${orderData.plan}!`, {
          id: "payment-verify",
          duration: 5000,
        });
        setIsProcessingPayment(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate Razorpay checkout");
      setIsProcessingPayment(false);
    }
  };

  const handleDowngradeToFree = async () => {
    if (window.confirm("Are you sure you want to cancel your Pro subscription and revert to the Starter Free Plan?")) {
      try {
        const updated = await paymentService.cancelSubscription();
        updateUser(updated);
        await fetchSubscriptionData();
        toast.success("Subscription cancelled. Reverted to Starter (Free Forever)");
      } catch (err: any) {
        toast.error(err.message || "Failed to cancel subscription");
      }
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-white">
            Settings & Preferences
          </h1>
          <p className="text-sm text-stone-500 dark:text-slate-400">
            Manage your account profile, visual theme, and subscription billing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400">
            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            {currentPlan === "starter" ? "Starter Free" : currentPlan === "pro" ? "Pro Copilot" : "Wealth & Family"}
          </span>
        </div>
      </div>

      {/* 1. USER PROFILE CARD */}
      <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20 font-bold text-xl">
            {user?.email ? user.email.charAt(0).toUpperCase() : <UserIcon size={24} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold text-stone-900 dark:text-white">
                {user?.email || "User Account"}
              </p>
              <BadgeCheck size={16} className="text-emerald-500" />
            </div>
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN") : "October 2026"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-stone-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-stone-600 dark:text-slate-300">
                Verified Account
              </span>
              <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                Zero Duplicate Shield: Active
              </span>
            </div>
          </div>
        </div>

        <Button variant="danger" onClick={handleLogout} className="shrink-0 w-full sm:w-auto">
          <LogOut size={15} />
          Sign Out
        </Button>
      </Card>

      {/* 2. THEME WALA SECTION: LIGHT (CLASSIC LEDGER) VS DARK (MIDNIGHT BLUE) */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-white flex items-center gap-2">
            <Moon size={18} className="text-orange-500 dark:text-blue-400" />
            Theme & Appearance
          </h2>
          <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
            Select your preferred visual aesthetic. Switch between the classic paper ledger and the midnight blue dark mode.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* THEME 1: CLASSIC LEDGER (LIGHT) */}
          <div
            onClick={() => handleThemeChange("light")}
            className={cn(
              "group relative cursor-pointer rounded-2xl border-2 p-5 transition-all duration-300 overflow-hidden",
              theme === "light"
                ? "border-orange-500 bg-white shadow-lg shadow-orange-500/10 ring-2 ring-orange-500/20"
                : "border-stone-200 bg-stone-50 hover:border-stone-300 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                    theme === "light"
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-stone-200 text-stone-700 dark:bg-slate-800 dark:text-slate-300"
                  )}
                >
                  <Sun size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                    Classic Ledger (Light)
                    {theme === "light" && (
                      <span className="rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 text-[10px] font-bold px-2 py-0.5">
                        Active
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                    Warm stone paper ledger with crisp contrast & orange accents
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border transition-all",
                  theme === "light"
                    ? "border-orange-500 bg-orange-500 text-white"
                    : "border-stone-300 bg-white dark:border-slate-700 dark:bg-slate-800"
                )}
              >
                {theme === "light" && <Check size={14} />}
              </div>
            </div>

            {/* Mini Visual Preview Mockup */}
            <div className="mt-4 rounded-xl border border-stone-200/90 bg-stone-100 p-3 bg-ledger-grid shadow-inner">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-stone-200 bg-white p-2 relative overflow-hidden shadow-2xs">
                  <div className="h-1 bg-orange-500 absolute top-0 inset-x-0" />
                  <div className="h-1.5 w-8 bg-stone-300 rounded mb-1" />
                  <div className="h-3 w-12 bg-stone-800 rounded font-bold" />
                </div>
                <div className="rounded-lg border border-stone-200 bg-white p-2 relative overflow-hidden shadow-2xs">
                  <div className="h-1 bg-emerald-500 absolute top-0 inset-x-0" />
                  <div className="h-1.5 w-8 bg-stone-300 rounded mb-1" />
                  <div className="h-3 w-12 bg-stone-800 rounded font-bold" />
                </div>
                <div className="rounded-lg border border-stone-200 bg-white p-2 relative overflow-hidden shadow-2xs">
                  <div className="h-1 bg-rose-500 absolute top-0 inset-x-0" />
                  <div className="h-1.5 w-8 bg-stone-300 rounded mb-1" />
                  <div className="h-3 w-12 bg-stone-800 rounded font-bold" />
                </div>
              </div>
            </div>
          </div>

          {/* THEME 2: MIDNIGHT SAPPHIRE (DARK BLUE) */}
          <div
            onClick={() => handleThemeChange("dark-blue")}
            className={cn(
              "group relative cursor-pointer rounded-2xl border-2 p-5 transition-all duration-300 overflow-hidden",
              theme === "dark-blue"
                ? "border-blue-500 bg-[#0f172a] shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/30"
                : "border-stone-200 bg-stone-50 hover:border-blue-300 dark:border-slate-800 dark:bg-[#0c1322] dark:hover:border-slate-700"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                    theme === "dark-blue"
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                  )}
                >
                  <Moon size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                    Midnight Sapphire (Dark Blue)
                    {theme === "dark-blue" && (
                      <span className="rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5">
                        Active
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                    Deep fintech navy with electric sapphire & glowing cyan accents
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border transition-all",
                  theme === "dark-blue"
                    ? "border-blue-500 bg-blue-600 text-white shadow-xs"
                    : "border-stone-300 bg-white dark:border-slate-700 dark:bg-slate-800"
                )}
              >
                {theme === "dark-blue" && <Check size={14} />}
              </div>
            </div>

            {/* Mini Visual Preview Mockup */}
            <div className="mt-4 rounded-xl border border-blue-900/40 bg-[#080d1a] p-3 bg-dark-blue-ledger shadow-inner">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-blue-900/50 bg-[#0f172a] p-2 relative overflow-hidden shadow-2xs">
                  <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-400 absolute top-0 inset-x-0" />
                  <div className="h-1.5 w-8 bg-blue-950/80 rounded mb-1" />
                  <div className="h-3 w-12 bg-white rounded font-bold" />
                </div>
                <div className="rounded-lg border border-blue-900/50 bg-[#0f172a] p-2 relative overflow-hidden shadow-2xs">
                  <div className="h-1 bg-emerald-500 absolute top-0 inset-x-0" />
                  <div className="h-1.5 w-8 bg-blue-950/80 rounded mb-1" />
                  <div className="h-3 w-12 bg-white rounded font-bold" />
                </div>
                <div className="rounded-lg border border-blue-900/50 bg-[#0f172a] p-2 relative overflow-hidden shadow-2xs">
                  <div className="h-1 bg-rose-500 absolute top-0 inset-x-0" />
                  <div className="h-1.5 w-8 bg-blue-950/80 rounded mb-1" />
                  <div className="h-3 w-12 bg-white rounded font-bold" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PRICING & SUBSCRIPTION WALA SECTION */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-white flex items-center gap-2">
              <CreditCard size={18} className="text-orange-500 dark:text-blue-400" />
              Subscription & Billing Plans
            </h2>
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
              Choose the license tier that fits your wealth tracking volume. Upgrade anytime with instant activation.
            </p>
          </div>

          {/* Monthly / Annual Toggle */}
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 dark:border-slate-800 bg-stone-100 dark:bg-slate-900 p-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={cn(
                "rounded-full px-3.5 py-1 text-xs font-semibold transition-all",
                !isAnnual
                  ? "bg-white text-stone-900 shadow-xs dark:bg-[#0f172a] dark:text-white"
                  : "text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={cn(
                "rounded-full px-3.5 py-1 text-xs font-semibold transition-all flex items-center gap-1.5",
                isAnnual
                  ? "bg-white text-stone-900 shadow-xs dark:bg-[#0f172a] dark:text-white"
                  : "text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <span>Annual</span>
              <span className="rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-1.5 py-0.2">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Current Subscription Active Status Card */}
        <Card className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-orange-500 dark:border-l-blue-500 p-5">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Zap size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono font-bold tracking-wider text-stone-500 dark:text-slate-400">
                  Current License
                </span>
                {currentPlan === "starter" ? (
                  <span className="rounded-full bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 px-2 py-0.5 text-[10px] font-bold">
                    Free Forever
                  </span>
                ) : user?.subscriptionStatus === "ACTIVE" ? (
                  <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800 text-[10px] font-bold px-2 py-0.5 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active Subscription
                  </span>
                ) : user?.subscriptionStatus === "CANCELLED" ? (
                  <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800 text-[10px] font-bold px-2 py-0.5">
                    Cancelled (Pending Expiry)
                  </span>
                ) : (
                  <span className="rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800 text-[10px] font-bold px-2 py-0.5">
                    Expired
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white mt-0.5">
                {currentPlan === "starter"
                  ? "CashFlow Starter (Free Forever)"
                  : currentPlan === "pro"
                  ? "CashFlow Pro Copilot"
                  : "CashFlow Wealth & Family"}
              </h3>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">
                {currentPlan === "starter"
                  ? "Standard personal budgeting with up to 5 statement uploads per month."
                  : "Unlimited statement ingestion, zero-duplicate cryptographic shield, and 24/7 AI Copilot."}
              </p>

              {user?.subscriptionExpiresAt && currentPlan !== "starter" && (
                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-stone-600 dark:text-slate-300">
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
                    <Clock size={12} />
                    Valid until: {new Date(user.subscriptionExpiresAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-slate-400">
                    ({subscriptionData.daysRemaining} days remaining • {user.planBillingCycle === "annual" ? "Annual License" : "Monthly License"})
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={fetchSubscriptionData}
              title="Refresh subscription status from database"
              className="p-2 rounded-xl border border-stone-200 text-stone-500 hover:text-stone-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-white transition-all"
            >
              <RefreshCw size={14} className={isLoadingSubscription ? "animate-spin" : ""} />
            </button>

            {currentPlan !== "starter" && (
              <button
                type="button"
                onClick={handleDowngradeToFree}
                className="text-xs text-stone-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
              >
                Cancel Subscription
              </button>
            )}

            {currentPlan === "starter" ? (
              <button
                type="button"
                onClick={() => openUpgradeModal("pro")}
                className="rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-orange-600/20 hover:brightness-110 transition-all"
              >
                Upgrade to Pro (₹199/mo)
              </button>
            ) : (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check size={14} /> Full Power Unlocked
              </span>
            )}
          </div>
        </Card>

        {/* 3 Tier Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* TIER 1: STARTER */}
          <div
            className={cn(
              "rounded-2xl border p-6 flex flex-col justify-between transition-all",
              currentPlan === "starter"
                ? "border-stone-400 bg-white shadow-sm dark:border-slate-700 dark:bg-[#0f172a]"
                : "border-stone-200 bg-white/70 dark:border-slate-800 dark:bg-[#0f172a]/60"
            )}
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-stone-900 dark:text-white">Starter</h3>
                <span className="rounded-full bg-stone-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-stone-600 dark:text-slate-300">
                  Free Forever
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-2">
                Essential personal tracking for individuals starting their budgeting journey.
              </p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold font-numeric text-stone-900 dark:text-white">₹0</span>
                <span className="text-xs text-stone-500 dark:text-slate-400">/ forever</span>
              </div>

              <div className="mt-6 space-y-2.5 text-xs text-stone-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>Manual Transaction Logging & AI Quick Add</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>Up to 5 Statement Imports / month</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>Standard Category Envelopes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>Single Bank Account Tracking</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={currentPlan === "starter"}
              onClick={handleDowngradeToFree}
              className={cn(
                "mt-6 w-full rounded-xl py-2.5 text-xs font-bold transition-all",
                currentPlan === "starter"
                  ? "bg-stone-100 text-stone-400 dark:bg-slate-800 dark:text-slate-500 cursor-default"
                  : "border border-stone-300 text-stone-700 hover:bg-stone-50 dark:border-slate-700 dark:text-slate-200"
              )}
            >
              {currentPlan === "starter" ? "Current Plan" : "Switch to Free"}
            </button>
          </div>

          {/* TIER 2: PRO COPILOT (MOST POPULAR) */}
          <div
            className={cn(
              "relative rounded-2xl border-2 p-6 flex flex-col justify-between shadow-xl transition-all",
              currentPlan === "pro"
                ? "border-orange-500 bg-orange-500/5 dark:border-orange-500 dark:bg-orange-500/10 shadow-orange-500/10"
                : "border-orange-500/80 bg-white dark:border-blue-500/70 dark:bg-[#0f172a] dark:shadow-blue-500/10"
            )}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-600 to-amber-500 px-3.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
              Recommended
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-stone-900 dark:text-white">Pro Copilot</h3>
                <span className="rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 px-2.5 py-0.5 text-[10px] font-bold border border-orange-200 dark:border-orange-900">
                  Full Power
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-2">
                For professionals and creators who want zero manual work and full financial automation.
              </p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold font-numeric text-stone-900 dark:text-white">
                  {isAnnual ? "₹199" : "₹249"}
                </span>
                <span className="text-xs text-stone-500 dark:text-slate-400">
                  / month {isAnnual && "(billed annually)"}
                </span>
              </div>

              <div className="mt-6 space-y-2.5 text-xs text-stone-700 dark:text-slate-200">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-orange-500 shrink-0" />
                  <span className="font-semibold text-stone-900 dark:text-white">Unlimited Statement Ingestion (PDF & Excel)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-orange-500 shrink-0" />
                  <span className="font-semibold text-stone-900 dark:text-white">Zero Duplicate Cryptographic Shield</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-orange-500 shrink-0" />
                  <span>24/7 AI Financial Advisor Chatbot</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-orange-500 shrink-0" />
                  <span>Smart Anomaly & Overspending Alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-orange-500 shrink-0" />
                  <span>Unlimited Accounts & Smart Categories</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={currentPlan === "pro"}
              onClick={() => openUpgradeModal("pro")}
              className={cn(
                "mt-6 w-full rounded-xl py-2.5 text-xs font-bold transition-all shadow-md",
                currentPlan === "pro"
                  ? "bg-emerald-600 text-white cursor-default"
                  : "bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:brightness-110"
              )}
            >
              {currentPlan === "pro" ? "Current Active Plan" : "Upgrade to Pro Copilot"}
            </button>
          </div>

          {/* TIER 3: WEALTH & FAMILY */}
          <div
            className={cn(
              "rounded-2xl border p-6 flex flex-col justify-between transition-all",
              currentPlan === "family"
                ? "border-emerald-500 bg-emerald-50/20 dark:border-emerald-500 dark:bg-emerald-950/20"
                : "border-stone-200 bg-white dark:border-slate-800 dark:bg-[#0f172a]"
            )}
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-stone-900 dark:text-white">Wealth & Family</h3>
                <span className="rounded-full bg-stone-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-stone-600 dark:text-slate-300">
                  Multi-User
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-2">
                Designed for high-net-worth households, joint accounts, and business owners.
              </p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold font-numeric text-stone-900 dark:text-white">
                  {isAnnual ? "₹499" : "₹599"}
                </span>
                <span className="text-xs text-stone-500 dark:text-slate-400">
                  / month {isAnnual && "(billed annually)"}
                </span>
              </div>

              <div className="mt-6 space-y-2.5 text-xs text-stone-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>Everything in Pro Copilot</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>Up to 5 Family Members with Shared Wallets</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>Multi-Bank UPI Auto-Reconciliation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>Chartered Accountant Tax Ledger Export</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={currentPlan === "family"}
              onClick={() => openUpgradeModal("family")}
              className={cn(
                "mt-6 w-full rounded-xl py-2.5 text-xs font-bold transition-all",
                currentPlan === "family"
                  ? "bg-emerald-600 text-white cursor-default"
                  : "border border-stone-300 text-stone-700 hover:bg-stone-50 dark:border-slate-700 dark:text-slate-200 hover:border-emerald-500"
              )}
            >
              {currentPlan === "family" ? "Current Active Plan" : "Upgrade to Wealth & Family"}
            </button>
          </div>
        </div>

        {/* Invoice & Billing History Table */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white">Billing History & Invoices</h3>
              <p className="text-xs text-stone-500 dark:text-slate-400">Download past tax invoices and payment receipts</p>
            </div>
            <span className="text-xs text-stone-500 dark:text-slate-400">Currency: INR (₹)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-slate-800 text-stone-500 dark:text-slate-400">
                  <th className="pb-2 font-semibold">Invoice ID</th>
                  <th className="pb-2 font-semibold">Date</th>
                  <th className="pb-2 font-semibold">Plan</th>
                  <th className="pb-2 font-semibold">Amount</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60">
                {subscriptionData.payments.length > 0 ? (
                  subscriptionData.payments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 font-mono font-medium text-stone-800 dark:text-slate-200">
                        INV-{p.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-3 text-stone-600 dark:text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 font-medium text-stone-800 dark:text-slate-200">
                        CashFlow {p.plan} ({p.billingCycle})
                      </td>
                      <td className="py-3 font-numeric font-bold text-stone-900 dark:text-white">
                        ₹{p.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold border",
                            p.status === "SUCCESS"
                              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                              : p.status === "FAILED"
                              ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                              : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                          )}
                        >
                          {p.status === "SUCCESS" ? "Paid" : p.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              generateTaxInvoicePDF(p, user);
                              toast.success(`Tax Invoice INV-${p.id.slice(-6).toUpperCase()} downloaded!`);
                            } catch (err: any) {
                              toast.error("Failed to generate PDF receipt");
                              console.error(err);
                            }
                          }}
                          className="inline-flex items-center gap-1 text-orange-600 dark:text-blue-400 hover:underline font-semibold"
                        >
                          <Download size={13} /> PDF
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-stone-400 dark:text-slate-500">
                      {currentPlan === "starter"
                        ? "You are currently on the Starter Free Plan. No invoices charged yet."
                        : "No invoice records found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* 4. NOTIFICATIONS PREFERENCES */}
      <Card className="flex flex-col gap-4 p-5">
        <div>
          <h2 className="text-base font-semibold text-stone-900 dark:text-white flex items-center gap-2">
            <Bell size={18} className="text-orange-500 dark:text-blue-400" />
            Notification Preferences
          </h2>
          <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
            Configure automated spending notifications and financial audits
          </p>
        </div>

        <div className="divide-y divide-stone-100 dark:divide-slate-800/80">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-xs font-semibold text-stone-800 dark:text-slate-200">
                Over-budget Anomaly Alerts
              </p>
              <p className="text-[11px] text-stone-500 dark:text-slate-400">
                Instant email notification when any category exceeds 80% of its budget limit.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleNotification("budgetAlerts")}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-hidden",
                notifications.budgetAlerts
                  ? "bg-orange-600 dark:bg-blue-600"
                  : "bg-stone-300 dark:bg-slate-700"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200",
                  notifications.budgetAlerts ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-xs font-semibold text-stone-800 dark:text-slate-200">
                Weekly AI Financial Digest
              </p>
              <p className="text-[11px] text-stone-500 dark:text-slate-400">
                Every Monday morning AI audit summarizing week-over-week outflows and savings.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleNotification("weeklyReport")}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-hidden",
                notifications.weeklyReport
                  ? "bg-orange-600 dark:bg-blue-600"
                  : "bg-stone-300 dark:bg-slate-700"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200",
                  notifications.weeklyReport ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-xs font-semibold text-stone-800 dark:text-slate-200">
                Zero-Duplicate Shield Prompts
              </p>
              <p className="text-[11px] text-stone-500 dark:text-slate-400">
                Warn immediately if an identical transaction hash is ingested via statement.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleNotification("duplicateWarnings")}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-hidden",
                notifications.duplicateWarnings
                  ? "bg-orange-600 dark:bg-blue-600"
                  : "bg-stone-300 dark:bg-slate-700"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200",
                  notifications.duplicateWarnings ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* UPGRADE CHECKOUT MODAL */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-stone-200 dark:border-blue-900/50 bg-white dark:bg-[#0f172a] p-6 shadow-2xl text-stone-900 dark:text-white">
            <button
              type="button"
              onClick={() => setIsUpgradeModalOpen(false)}
              className="absolute right-5 top-5 rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white shadow-sm">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">
                    {selectedUpgradeTier === "pro" ? "Upgrade to Pro Copilot" : "Upgrade to Wealth & Family"}
                  </h3>
                  <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold">
                    Test Mode
                  </span>
                </div>
                <span className="text-xs text-stone-500 dark:text-slate-400">
                  Instant activation • Zero KYC needed in Test Mode
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900/60 p-4 mb-5">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-stone-500 dark:text-slate-400">Plan Total:</span>
                <span className="text-2xl font-black font-numeric text-stone-900 dark:text-white">
                  {selectedUpgradeTier === "pro"
                    ? isAnnual
                      ? "₹2,388 / year (₹199/mo)"
                      : "₹249 / month"
                    : isAnnual
                    ? "₹5,988 / year (₹499/mo)"
                    : "₹599 / month"}
                </span>
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                ✓ Full database verification & automatic plan activation
              </p>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3 mb-6">
              <span className="text-xs font-semibold text-stone-700 dark:text-slate-300 block">
                Select Payment Method (India UPI / Cards):
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("upi")}
                  className={cn(
                    "rounded-xl border p-3 text-xs font-bold flex items-center justify-center gap-2 transition-all",
                    paymentMethod === "upi"
                      ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-400"
                      : "border-stone-200 dark:border-slate-800 hover:bg-stone-50 dark:hover:bg-slate-800/40"
                  )}
                >
                  <span>⚡ UPI (GPay/PhonePe)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={cn(
                    "rounded-xl border p-3 text-xs font-bold flex items-center justify-center gap-2 transition-all",
                    paymentMethod === "card"
                      ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-400"
                      : "border-stone-200 dark:border-slate-800 hover:bg-stone-50 dark:hover:bg-slate-800/40"
                  )}
                >
                  <span>💳 Debit / Credit Card</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={isProcessingPayment}
              onClick={handleInitiateRazorpay}
              className="w-full rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-orange-600/25 hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              {isProcessingPayment ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Razorpay Checkout...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Pay & Activate via Razorpay</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>

            <div className="mt-3.5 flex items-center justify-center gap-1.5 text-[11px] text-stone-400 dark:text-slate-500">
              <ShieldCheck size={13} className="text-emerald-500" />
              <span>100% Encrypted via Razorpay Payment Gateway (PCI-DSS Level 1)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
