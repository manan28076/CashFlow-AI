import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileText,
  BarChart3,
  Bot,
  Zap,
  Check,
  Lock,
  ChevronRight,
  TrendingUp,
  X,
  CreditCard,
  Building2,
  PieChart,
  Copy,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export const LandingPage = () => {
  const { user, isAuthenticated, login, register, loginWithGoogle, loginWithDemo } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Pricing toggle state
  const [isAnnual, setIsAnnual] = useState(true);

  // Interactive showcase tab
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<
    "dashboard" | "parser" | "dedup" | "copilot"
  >("dashboard");

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If URL is /login or /register or has ?auth=login/?auth=register, open modal automatically
  useEffect(() => {
    const path = window.location.pathname;
    const authParam = searchParams.get("auth");
    if (path === "/login" || authParam === "login") {
      setAuthMode("login");
      setIsAuthModalOpen(true);
    } else if (path === "/register" || authParam === "register") {
      setAuthMode("register");
      setIsAuthModalOpen(true);
    }
  }, [searchParams]);

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (authMode === "register" && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      if (authMode === "login") {
        await login({ email, password });
        toast.success("Welcome back to CashFlow AI!");
      } else {
        await register({ email, password });
        toast.success("Account created successfully!");
      }
      setIsAuthModalOpen(false);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      toast.error("Google credential missing");
      return;
    }
    try {
      await loginWithGoogle(credentialResponse.credential);
      toast.success("Signed in with Google!");
      setIsAuthModalOpen(false);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    }
  };

  const handleDemoLaunch = async () => {
    try {
      toast.loading("Loading realistic Indian demo data...", { id: "demo-loading" });
      await loginWithDemo();
      toast.success("Welcome to Demo Mode!", { id: "demo-loading" });
      navigate("/dashboard");
    } catch (e) {
      toast.error("Failed to load demo account", { id: "demo-loading" });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#07090e] text-stone-100 font-sans selection:bg-orange-500/30 selection:text-orange-200 overflow-x-hidden">
      {/* AMBIENT RADIAL LIGHTING */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[1000px] rounded-full bg-gradient-to-b from-orange-500/15 via-amber-500/5 to-transparent blur-3xl" />
        <div className="absolute top-1/3 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 -right-40 h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#07090e]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/25 transition-transform duration-300 group-hover:scale-105">
              <Sparkles size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                CashFlow <span className="text-orange-500">AI</span>
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400">
                Fintech Copilot
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-400">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#demo" className="hover:text-white transition-colors">
              Product Demo
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#reviews" className="hover:text-white transition-colors">
              Reviews
            </a>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3.5">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-stone-900 shadow-lg shadow-white/10 transition-all hover:bg-stone-100 hover:scale-[1.02]"
              >
                Go to Dashboard
                <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleDemoLaunch}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-all"
                >
                  <Zap size={13} className="text-amber-400" />
                  <span>Try Demo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setIsAuthModalOpen(true);
                  }}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-stone-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  Log in
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setIsAuthModalOpen(true);
                  }}
                  className="rounded-full bg-white px-5 py-2.5 text-xs font-bold text-stone-950 shadow-md shadow-white/10 transition-all hover:bg-stone-200 hover:scale-[1.02]"
                >
                  Get started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION WITH COPILOT-STYLE 3D FLOATING PILLS */}
      <section className="relative pt-24 pb-20 md:pt-36 md:pb-32 px-6 lg:px-10 overflow-hidden text-center">
        {/* Floating Category Pills */}
        <div className="pointer-events-none absolute inset-0 max-w-7xl mx-auto hidden lg:block select-none">
          {/* Pill 1: GROCERIES */}
          <div
            className="animate-float-slow absolute top-12 left-[6%] rounded-full border border-rose-500/30 bg-rose-950/40 px-5 py-2.5 text-xs font-bold tracking-wider text-rose-300 shadow-xl backdrop-blur-md"
            style={{ "--rot": "-7deg" } as any}
          >
            🍎 GROCERIES
          </div>

          {/* Pill 2: DATE NIGHT */}
          <div
            className="animate-float-medium absolute top-8 right-[8%] rounded-full border border-purple-500/30 bg-purple-950/40 px-5 py-2.5 text-xs font-bold tracking-wider text-purple-300 shadow-xl backdrop-blur-md"
            style={{ "--rot": "6deg" } as any}
          >
            🍷 DATE NIGHT
          </div>

          {/* Pill 3: ZERODHA SIP */}
          <div
            className="animate-float-reverse absolute top-48 left-[3%] rounded-full border border-emerald-500/30 bg-emerald-950/40 px-5 py-2.5 text-xs font-bold tracking-wider text-emerald-300 shadow-xl backdrop-blur-md"
            style={{ "--rot": "-4deg" } as any}
          >
            📈 ZERODHA SIP
          </div>

          {/* Pill 4: BABY & FAMILY */}
          <div
            className="animate-float-slow absolute top-44 right-[5%] rounded-full border border-pink-500/30 bg-pink-950/40 px-5 py-2.5 text-xs font-bold tracking-wider text-pink-300 shadow-xl backdrop-blur-md"
            style={{ "--rot": "8deg" } as any}
          >
            🧸 BABY & FAMILY
          </div>

          {/* Pill 5: HOUSE RENT */}
          <div
            className="animate-float-medium absolute bottom-8 left-[12%] rounded-full border border-amber-500/30 bg-amber-950/40 px-5 py-2.5 text-xs font-bold tracking-wider text-amber-300 shadow-xl backdrop-blur-md"
            style={{ "--rot": "6deg" } as any}
          >
            🏡 HOUSE RENT
          </div>

          {/* Pill 6: TRAVEL */}
          <div
            className="animate-float-reverse absolute bottom-6 right-[12%] rounded-full border border-cyan-500/30 bg-cyan-950/40 px-5 py-2.5 text-xs font-bold tracking-wider text-cyan-300 shadow-xl backdrop-blur-md"
            style={{ "--rot": "-6deg" } as any}
          >
            ✈️ TRAVEL & FLIGHTS
          </div>

          {/* Pill 7: SWIGGY / ZOMATO */}
          <div
            className="animate-float-slow absolute top-2 right-[32%] rounded-full border border-orange-500/30 bg-orange-950/40 px-4 py-2 text-xs font-bold tracking-wider text-orange-300 shadow-xl backdrop-blur-md"
            style={{ "--rot": "-2deg" } as any}
          >
            🍕 SWIGGY & CHAI
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative mx-auto max-w-4xl z-10">
          {/* High-Profile Launch Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent px-4 py-1.5 text-xs font-semibold text-orange-400 mb-8 backdrop-blur-md shadow-inner">
            <Sparkles size={14} className="text-orange-400 animate-pulse" />
            <span>AI Statement Parsing & Zero-Duplicate Shield Live</span>
            <ChevronRight size={13} className="text-orange-400" />
          </div>

          {/* Main Giant Headline */}
          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[1.06] text-white">
            Your money,{" "}
            <span className="block bg-gradient-to-r from-white via-stone-200 to-orange-400 bg-clip-text text-transparent">
              beautifully organized.
            </span>
          </h1>

          {/* High-Class Subtitle */}
          <p className="mt-7 text-base sm:text-xl text-stone-400 max-w-2xl mx-auto leading-relaxed">
            All of your bank accounts, UPI spends, and investments, automatically tracked,
            categorized, and audited with financial intelligence.
          </p>

          {/* Hero Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                setAuthMode("register");
                setIsAuthModalOpen(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-white px-8 py-4 text-sm font-bold text-stone-950 shadow-2xl shadow-white/20 hover:bg-stone-200 hover:scale-[1.03] transition-all duration-200"
            >
              <span>Get started free</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={handleDemoLaunch}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-8 py-4 text-sm font-semibold text-stone-200 hover:bg-white/[0.08] hover:text-white hover:border-white/25 backdrop-blur-md transition-all duration-200"
            >
              <Zap size={16} className="text-amber-400" />
              <span>Explore Live Demo (1-Click)</span>
            </button>
          </div>

          {/* Social Proof Strip */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-500 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              Zero duplicate transactions guarantee
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <FileText size={14} className="text-orange-400" />
              Parses Indian bank statements & UPI
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Lock size={14} className="text-sky-400" />
              256-bit encryption & private
            </span>
          </div>
        </div>
      </section>

      {/* INTERACTIVE PRODUCT SHOWCASE SECTION */}
      <section id="demo" className="py-20 px-6 lg:px-10 max-w-7xl mx-auto">
        <div className="rounded-3xl border border-white/[0.08] bg-[#0d111a]/80 p-4 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-black/80">
          {/* Window Bar Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="h-3 w-3 rounded-full bg-green-500/80" />
              </div>
              <div className="rounded-lg bg-black/40 px-3 py-1 font-mono text-[11px] text-stone-400 border border-white/[0.05]">
                https://cashflow.ai/dashboard
              </div>
            </div>

            {/* Showcase Feature Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/[0.05]">
              <button
                type="button"
                onClick={() => setActiveShowcaseTab("dashboard")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeShowcaseTab === "dashboard"
                    ? "bg-orange-600 text-white shadow-xs"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => setActiveShowcaseTab("parser")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeShowcaseTab === "parser"
                    ? "bg-orange-600 text-white shadow-xs"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                Statement Ingestion
              </button>
              <button
                type="button"
                onClick={() => setActiveShowcaseTab("dedup")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeShowcaseTab === "dedup"
                    ? "bg-orange-600 text-white shadow-xs"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                Zero Duplicates
              </button>
              <button
                type="button"
                onClick={() => setActiveShowcaseTab("copilot")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeShowcaseTab === "copilot"
                    ? "bg-orange-600 text-white shadow-xs"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                AI Financial Chat
              </button>
            </div>
          </div>

          {/* Interactive Screen Display */}
          <div className="relative rounded-2xl border border-white/[0.05] bg-[#080b11] p-6 lg:p-8 min-h-[420px] flex flex-col justify-between">
            {activeShowcaseTab === "dashboard" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* 5 Summary Metric Cards Mockup */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
                  <div className="rounded-xl border border-orange-500/30 bg-orange-950/20 p-4 relative overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-500 absolute top-0 inset-x-0" />
                    <span className="text-[10px] font-bold text-stone-400 uppercase">Total Balance</span>
                    <div className="text-xl font-bold font-numeric text-white mt-1">₹1,94,266</div>
                    <span className="text-[10px] text-orange-400 font-medium">Net liquidity</span>
                  </div>
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 relative overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500 absolute top-0 inset-x-0" />
                    <span className="text-[10px] font-bold text-stone-400 uppercase">Total Income</span>
                    <div className="text-xl font-bold font-numeric text-emerald-400 mt-1">₹2,82,000</div>
                    <span className="text-[10px] text-emerald-500 font-medium">+ Inflow</span>
                  </div>
                  <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 relative overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-rose-500 to-red-500 absolute top-0 inset-x-0" />
                    <span className="text-[10px] font-bold text-stone-400 uppercase">Total Expense</span>
                    <div className="text-xl font-bold font-numeric text-rose-400 mt-1">₹87,734</div>
                    <span className="text-[10px] text-rose-500 font-medium">- Outflow</span>
                  </div>
                  <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 relative overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500 absolute top-0 inset-x-0" />
                    <span className="text-[10px] font-bold text-stone-400 uppercase">This Month</span>
                    <div className="text-xl font-bold font-numeric text-amber-400 mt-1">₹53,000</div>
                    <span className="text-[10px] text-amber-500 font-medium">Oct 2026 cycle</span>
                  </div>
                  <div className="col-span-2 lg:col-span-1 rounded-xl border border-sky-500/30 bg-sky-950/20 p-4 relative overflow-hidden flex flex-col justify-between">
                    <div className="h-1 bg-gradient-to-r from-sky-500 to-blue-500 absolute top-0 inset-x-0" />
                    <span className="text-[10px] font-bold text-stone-400 uppercase">Budget Status</span>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-1 border border-emerald-500/30 mt-1 w-fit">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      On Track
                    </div>
                    <span className="text-[10px] text-stone-400 mt-1">Cap: ₹65,000</span>
                  </div>
                </div>

                {/* Split charts visual */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-stone-300">Category Expense Distribution</span>
                      <span className="text-[11px] text-orange-400 font-medium">October 2026</span>
                    </div>
                    <div className="flex items-center justify-center gap-6 py-4">
                      <div className="h-28 w-28 rounded-full border-8 border-orange-500 border-t-emerald-500 border-l-purple-500 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">₹53,000</span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-orange-500" /> Food (38%)</div>
                        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-purple-500" /> Bills (26%)</div>
                        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Investment (21%)</div>
                        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-500" /> Travel (15%)</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-stone-300">Income vs Outflow Growth</span>
                      <span className="text-[11px] text-emerald-400 font-mono font-bold">+₹1,06,532 Saved</span>
                    </div>
                    <div className="h-32 flex items-end justify-between gap-3 px-2 pt-4">
                      {["Jul", "Aug", "Sep", "Oct"].map((m, idx) => (
                        <div key={m} className="flex-1 flex flex-col items-center gap-1.5">
                          <div className="w-full flex items-end justify-center gap-1.5 h-24">
                            <div
                              className="w-3 rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400"
                              style={{ height: `${[75, 80, 85, 90][idx]}%` }}
                            />
                            <div
                              className="w-3 rounded-t bg-gradient-to-t from-rose-600 to-rose-400"
                              style={{ height: `${[35, 45, 60, 48][idx]}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-stone-500">{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeShowcaseTab === "parser" && (
              <div className="space-y-4 animate-in fade-in duration-300 py-4">
                <div className="rounded-xl border-2 border-dashed border-orange-500/40 bg-orange-500/5 p-8 text-center">
                  <div className="h-12 w-12 rounded-xl bg-orange-600/20 text-orange-400 mx-auto flex items-center justify-center mb-3">
                    <FileText size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-white">Drop your Bank PDF or Excel Statement</h4>
                  <p className="text-xs text-stone-400 mt-1 max-w-md mx-auto">
                    HDFC, SBI, ICICI, Axis, PhonePe, Google Pay, or Paytm. Our Indian financial parser
                    translates messy UPI narrations into clean merchant records automatically.
                  </p>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4 divide-y divide-white/[0.04] text-xs">
                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-stone-400">UPI/DR/48392019/SWIGGY/swiggy@icici</span>
                      <div className="text-[11px] text-emerald-400 font-semibold">Parsed: Swiggy • Food</div>
                    </div>
                    <span className="font-bold text-rose-400">-₹420</span>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-stone-400">ACH/CREDIT/SALARY-OCTOBER/TECHCORP</span>
                      <div className="text-[11px] text-emerald-400 font-semibold">Parsed: Salary & Payout • Salary</div>
                    </div>
                    <span className="font-bold text-emerald-400">+₹95,000</span>
                  </div>
                </div>
              </div>
            )}

            {activeShowcaseTab === "dedup" && (
              <div className="space-y-4 animate-in fade-in duration-300 py-4">
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Copy size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-200">
                      Zero Accidental Duplicates Guard
                    </h4>
                    <p className="text-xs text-amber-300/80 mt-1 leading-relaxed">
                      Every transaction is hashed with SHA-256 (Date, Amount, Account, Narration).
                      If you accidentally submit twice or upload an overlapping bank statement,
                      CashFlow AI catches it instantly and prompts you before saving.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-stone-800 bg-stone-900/90 p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold text-stone-300">
                    <span>⚠️ Duplicate Transaction Warning</span>
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-amber-400">Blocked</span>
                  </div>
                  <p className="text-stone-400">
                    A transaction for ₹1,500 on 10 Oct 2026 with description 'Grocery Shopping'
                    already exists in your HDFC account.
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <span className="rounded bg-white/10 px-3 py-1 text-stone-300">Same One (Cancel)</span>
                    <span className="rounded bg-amber-600 px-3 py-1 text-white font-semibold">
                      Override & Add As New
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeShowcaseTab === "copilot" && (
              <div className="space-y-4 animate-in fade-in duration-300 py-4">
                <div className="rounded-xl border border-white/[0.08] bg-black/40 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-7 w-7 rounded-lg bg-orange-600/30 text-orange-400 flex items-center justify-center shrink-0 text-xs font-bold">
                      YOU
                    </div>
                    <p className="text-xs text-stone-300 bg-white/[0.04] p-2.5 rounded-xl border border-white/[0.04]">
                      "How much did I spend on dining and groceries this month compared to last month?"
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-7 w-7 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold">
                      <Bot size={14} />
                    </div>
                    <div className="text-xs text-stone-200 bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/20 space-y-1.5">
                      <p>
                        In <strong>October 2026</strong>, you spent <strong>₹17,570</strong> on Food &
                        Groceries across 14 transactions (mostly Swiggy and Zepto).
                      </p>
                      <p className="text-emerald-400 font-semibold">
                        📉 That is 18% lower than September (₹21,400). You are well within your ₹20,000
                        category budget!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CORE CLASSY FEATURES SECTION */}
      <section id="features" className="py-24 px-6 lg:px-10 max-w-7xl mx-auto border-t border-white/[0.06]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-orange-400">
            Engineered for Precision
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-black text-white mt-2">
            Finance tools built for people who care about details.
          </h2>
          <p className="text-stone-400 text-sm sm:text-base mt-4">
            No bloated menus. No ads selling credit cards. Pure financial intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c1018]/60 p-6 backdrop-blur-md hover:border-orange-500/40 hover:-translate-y-1 transition-all duration-300 group">
            <div className="h-12 w-12 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <FileText size={22} />
            </div>
            <h3 className="text-base font-bold text-white">Bank & UPI Statement Parser</h3>
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              Drop messy PDF or Excel bank statements. Our parser normalizes raw bank narration codes into
              recognizable merchants and categories in seconds.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#0c1018]/60 p-6 backdrop-blur-md hover:border-amber-500/40 hover:-translate-y-1 transition-all duration-300 group">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Copy size={22} />
            </div>
            <h3 className="text-base font-bold text-white">Zero Duplicate Shield</h3>
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              Never worry about double-counting transactions. Standardized SHA-256 fingerprinting flags and
              cleans duplicate data with 1-click precision.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#0c1018]/60 p-6 backdrop-blur-md hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300 group">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <BarChart3 size={22} />
            </div>
            <h3 className="text-base font-bold text-white">Predictive Category Budgets</h3>
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              Visual category envelopes with real-time progress indicators and active alerts when you approach or
              exceed your monthly limits.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#0c1018]/60 p-6 backdrop-blur-md hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-300 group">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Bot size={22} />
            </div>
            <h3 className="text-base font-bold text-white">AI Financial Copilot</h3>
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              Ask any question in plain English or Hinglish. Get instant spending breakdowns, savings advice, and
              comprehensive monthly audit reports.
            </p>
          </div>
        </div>
      </section>

      {/* CLASSY PRICING SECTION */}
      <section id="pricing" className="py-24 px-6 lg:px-10 max-w-7xl mx-auto border-t border-white/[0.06]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-orange-400">
            Simple, Transparent Pricing
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-black text-white mt-2">
            Invest in your financial peace of mind.
          </h2>
          <p className="text-stone-400 text-sm sm:text-base mt-4">
            Zero ads, no hidden fees. Choose the tier that matches your wealth journey.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/[0.1] bg-white/[0.03] p-1.5 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`rounded-full px-5 py-2 text-xs font-semibold transition-all ${
                !isAnnual
                  ? "bg-white text-stone-950 shadow-md"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              Monthly billing
            </button>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`rounded-full px-5 py-2 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isAnnual
                  ? "bg-white text-stone-950 shadow-md"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              <span>Annual billing</span>
              <span className="rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 border border-emerald-500/30">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Tier 1: Starter (Free) */}
          <div className="rounded-3xl border border-white/[0.08] bg-[#0c1018]/60 p-8 backdrop-blur-xl flex flex-col justify-between hover:border-white/20 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Starter</h3>
                <span className="rounded-full bg-stone-800 px-3 py-1 text-[11px] font-semibold text-stone-300">
                  Free Forever
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-2">
                Essential personal tracking for individuals starting their budgeting journey.
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold font-numeric text-white">₹0</span>
                <span className="text-xs text-stone-500">/ forever</span>
              </div>

              <div className="mt-8 space-y-3 text-xs text-stone-300">
                <div className="flex items-center gap-2.5">
                  <Check size={14} className="text-emerald-400 shrink-0" />
                  <span>Manual Transaction Logging & AI Quick Add</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={14} className="text-emerald-400 shrink-0" />
                  <span>Up to 5 Statement Imports / month</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={14} className="text-emerald-400 shrink-0" />
                  <span>Standard Category Envelopes</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={14} className="text-emerald-400 shrink-0" />
                  <span>Single Bank Account Tracking</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setAuthMode("register");
                setIsAuthModalOpen(true);
              }}
              className="mt-8 w-full rounded-full border border-white/20 bg-white/5 py-3 text-xs font-bold text-white hover:bg-white/10 transition-all"
            >
              Get Started Free
            </button>
          </div>

          {/* Tier 2: Pro Copilot (POPULAR) */}
          <div className="relative rounded-3xl border-2 border-orange-500 bg-gradient-to-b from-orange-500/10 via-[#0e131d] to-[#0c1018] p-8 backdrop-blur-xl flex flex-col justify-between shadow-2xl shadow-orange-500/10 transform lg:-translate-y-3">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-600 to-amber-500 px-4 py-1 text-[11px] font-bold text-white uppercase tracking-wider shadow-md">
              Most Popular
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Pro Copilot</h3>
                <span className="rounded-full bg-orange-500/20 px-3 py-1 text-[11px] font-bold text-orange-400 border border-orange-500/30">
                  Full Power
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-2">
                For professionals and creators who want zero manual work and full financial automation.
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold font-numeric text-white">
                  {isAnnual ? "₹199" : "₹249"}
                </span>
                <span className="text-xs text-stone-400">/ month {isAnnual && "(billed annually)"}</span>
              </div>

              <div className="mt-8 space-y-3 text-xs text-stone-200">
                <div className="flex items-center gap-2.5">
                  <Check size={14} className="text-orange-400 shrink-0" />
                  <span className="font-semibold text-white">Unlimited Bank & UPI Statement Ingestion</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={14} className="text-orange-400 shrink-0" />
                  <span className="font-semibold text-white">Zero Duplicate Cryptographic Shield</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={14} className="text-orange-400 shrink-0" />
                  <span>24/7 AI Financial Advisor Chatbot</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={14} className="text-orange-400 shrink-0" />
                  <span>Smart Anomaly & Overspending Alerts</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={14} className="text-orange-400 shrink-0" />
                  <span>Unlimited Accounts & Smart Categories</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={14} className="text-orange-400 shrink-0" />
                  <span>Exportable Executive AI Audit Reports</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setAuthMode("register");
                setIsAuthModalOpen(true);
              }}
              className="mt-8 w-full rounded-full bg-gradient-to-r from-orange-600 to-amber-500 py-3.5 text-xs font-bold text-white shadow-lg shadow-orange-500/25 hover:from-orange-500 hover:to-amber-400 transition-all hover:scale-[1.02]"
            >
              Start 14-Day Free Trial
            </button>
          </div>

          {/* Tier 3: Wealth & Family */}
          <div className="rounded-3xl border border-white/[0.08] bg-[#0c1018]/60 p-8 backdrop-blur-xl flex flex-col justify-between hover:border-white/20 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Wealth & Family</h3>
                <span className="rounded-full bg-stone-800 px-3 py-1 text-[11px] font-semibold text-stone-300">
                  Multi-User
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-2">
                Designed for high-net-worth households, joint accounts, and business owners.
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold font-numeric text-white">
                  {isAnnual ? "₹499" : "₹599"}
                </span>
                <span className="text-xs text-stone-500">/ month {isAnnual && "(billed annually)"}</span>
              </div>

              <div className="mt-8 space-y-3 text-xs text-stone-300">
                <div className="flex items-center gap-2.5">
                  <Check size={14} className="text-emerald-400 shrink-0" />
                  <span>Everything in Pro Copilot</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={14} className="text-emerald-400 shrink-0" />
                  <span>Up to 5 Family Members with Shared Wallets</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={14} className="text-emerald-400 shrink-0" />
                  <span>Chartered Accountant Tax Ledger Export</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={14} className="text-emerald-400 shrink-0" />
                  <span>Priority AI Processing & Custom Categorization</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setAuthMode("register");
                setIsAuthModalOpen(true);
              }}
              className="mt-8 w-full rounded-full border border-white/20 bg-white/5 py-3 text-xs font-bold text-white hover:bg-white/10 transition-all"
            >
              Choose Wealth & Family
            </button>
          </div>
        </div>
      </section>

      {/* REVIEWS & SOCIAL PROOF */}
      <section id="reviews" className="py-24 px-6 lg:px-10 max-w-7xl mx-auto border-t border-white/[0.06]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-orange-400">
            Real User Stories
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-black text-white mt-2">
            Loved by builders, investors, and creators.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c1018]/60 p-6 backdrop-blur-md">
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed italic">
              "Finally, a finance app in India that parses ugly bank statement PDF narrations with 100%
              accuracy. No more typing Swiggy or Uber bills manually."
            </p>
            <div className="mt-5 flex items-center gap-3 border-t border-white/[0.06] pt-4">
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-bold text-white text-xs">
                RS
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Rahul Sharma</h4>
                <p className="text-[11px] text-stone-400">Engineering Lead, Bengaluru</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#0c1018]/60 p-6 backdrop-blur-md">
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed italic">
              "The zero duplicate detector caught an identical ₹3,500 restaurant charge that hit my card twice
              during a server glitch. Saved me hours of calling customer support."
            </p>
            <div className="mt-5 flex items-center gap-3 border-t border-white/[0.06] pt-4">
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center font-bold text-white text-xs">
                PM
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Priya Malhotra</h4>
                <p className="text-[11px] text-stone-400">Product Designer, Mumbai</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#0c1018]/60 p-6 backdrop-blur-md">
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed italic">
              "The UI feels like an Apple-designed app. The animated pie chart and metal smart cards look so
              classy compared to any old expense app."
            </p>
            <div className="mt-5 flex items-center gap-3 border-t border-white/[0.06] pt-4">
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-xs">
                AK
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Aman Kulkarni</h4>
                <p className="text-[11px] text-stone-400">Freelance Founder, Pune</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.08] bg-[#05070a] py-14 px-6 lg:px-10">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-stone-400">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white font-bold">
              <Sparkles size={16} />
            </div>
            <div>
              <span className="font-bold text-white">CashFlow AI</span> — High-Profile Personal Finance
            </div>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-stone-300">
              <Lock size={12} className="text-emerald-400" />
              End-to-End Encrypted
            </span>
            <span>•</span>
            <span>Zero Tracking Ads</span>
            <span>•</span>
            <span>Made with pride in India</span>
          </div>
        </div>
      </footer>

      {/* AUTH POPUP MODAL (LOGIN / REGISTER) */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0c1018] p-6 sm:p-8 shadow-2xl text-stone-100">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-5 right-5 rounded-full p-1.5 text-stone-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            {/* Modal Title & Tab Switcher */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-600 text-white font-bold">
                  <Sparkles size={14} />
                </div>
                <span className="font-display font-bold text-white text-base">CashFlow AI</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-white">
                {authMode === "login" ? "Welcome back" : "Create your account"}
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                {authMode === "login"
                  ? "Enter your credentials or try instant demo mode"
                  : "Start organizing your finances with intelligence"}
              </p>

              {/* Mode Toggle */}
              <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-white/[0.05] p-1 border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                    authMode === "login"
                      ? "bg-white text-stone-950 shadow-xs"
                      : "text-stone-400 hover:text-white"
                  }`}
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("register")}
                  className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                    authMode === "register"
                      ? "bg-white text-stone-950 shadow-xs"
                      : "text-stone-400 hover:text-white"
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-stone-500 focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-stone-500 focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>

              {authMode === "register" && (
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-stone-500 focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-orange-600 py-3 text-xs font-bold text-white shadow-lg shadow-orange-600/30 hover:bg-orange-500 transition-all hover:scale-[1.01] disabled:opacity-50 mt-2"
              >
                {isSubmitting
                  ? "Processing..."
                  : authMode === "login"
                  ? "Sign In to CashFlow AI"
                  : "Create Account"}
              </button>
            </form>

            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.08]" />
              </div>
              <span className="relative bg-[#0c1018] px-2 text-[10px] uppercase font-bold text-stone-500">
                Or continue with
              </span>
            </div>

            {/* Google Login & Demo Mode Buttons */}
            <div className="space-y-2.5">
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error("Google sign-in was unsuccessful")}
                  shape="rectangular"
                  theme="filled_black"
                  width="100%"
                />
              </div>

              <button
                type="button"
                onClick={handleDemoLaunch}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 py-2.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-all"
              >
                <Zap size={14} className="text-amber-400" />
                <span>✨ Launch Demo Mode (Instant Access)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
