



import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabase";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import AuthLayout from "../components/AuthLayout";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState<string | null>(null);

  // show “confirm your email” banner
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resentOK, setResentOK] = useState(false);

  // If user just came from sign-up, show the banner by default
  useEffect(() => {
    const pending = localStorage.getItem("signup:pendingEmail");
    if (pending) setVerifyEmail(pending);
  }, []);

  const resendConfirmation = async () => {
    const target = verifyEmail || email;
    if (!target) {
      setErr("Enter your email address and try again.");
      return;
    }
    setResending(true);
    setErr(null);
    setResentOK(false);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: target,
      });
      if (error) {
        setErr(error.message);
      } else {
        setResentOK(true);
        // keep banner visible and keep the remembered email
        if (!verifyEmail) setVerifyEmail(target);
      }
    } catch (e: any) {
      setErr(e?.message || "Could not resend confirmation email.");
    } finally {
      setResending(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      // If the user hasn't confirmed their email yet, show the banner
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("confirm") || msg.includes("not confirmed")) {
        setVerifyEmail(email);
        // keep a friendly inline error too
        setErr("Please confirm your email. We can resend the link below.");
      } else {
        setErr(error.message);
      }
      return;
    }

    // Successful login: clear the pending flag since they’re verified
    localStorage.removeItem("signup:pendingEmail");

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem("user", JSON.stringify(data.user));
    storage.setItem("isAuthenticated", "true");

    navigate("/onboarding"); // login -> onboarding (then your onboarding routes to envirotrace)
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your SupreFarm account">
      {/* Confirm-your-email banner */}
      {verifyEmail && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          We sent a confirmation link to <strong>{verifyEmail}</strong>. Please
          check your inbox (and spam) to verify your email before signing in.
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={resendConfirmation}
              disabled={resending}
              className="text-emerald-700 underline disabled:opacity-60"
            >
              {resending ? "Resending..." : "Resend confirmation email"}
            </button>
            {resentOK && <span className="text-emerald-700">Link sent ✅</span>}
          </div>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email */}
        <div className="relative">
          <label htmlFor="email" className="sr-only">Email Address</label>
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Mail size={18} className="text-gray-400" />
          </div>
          <input
            id="email"
            type="email"
            required
            placeholder="your@email.com"
            className="w-full rounded-lg border border-gray-200 pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="relative">
          <label htmlFor="password" className="sr-only">Password</label>
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Lock size={18} className="text-gray-400" />
          </div>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            placeholder="Enter your password"
            className="w-full rounded-lg border border-gray-200 pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
            onClick={() => setShowPassword((s) => !s)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Remember Me */}
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={() => setRememberMe((s) => !s)}
            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          Remember me
        </label>

        {/* Error */}
        {err && <p className="text-sm text-red-600">{err}</p>}

        {/* Submit */}
        <button
          type="submit"
          className="w-full inline-flex items-center justify-center rounded-lg py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition"
          disabled={loading}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="animate-spin" size={16} /> Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      {/* Footer links */}
      <div className="mt-6 flex items-center justify-between text-sm">
        <Link to="/forgot-password" className="text-emerald-700 hover:underline">
          Forgot password?
        </Link>
        <div className="text-gray-600">
          New to SupreFarm?{" "}
          <Link to="/signup" className="text-emerald-700 font-medium hover:underline">
            Create account
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
