

import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabase";
import { User, Mail, Phone, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import AuthLayout from "../components/AuthLayout";

const SignUp: React.FC = () => {
  const navigate = useNavigate();

  // form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // ui state
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  // validation
  const passwordTooShort = password.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && confirm !== password;

  const canSubmit = useMemo(
    () =>
      fullName.trim().length > 1 &&
      /\S+@\S+\.\S+/.test(email) &&
      !passwordTooShort &&
      confirm === password &&
      agree &&
      !loading,
    [fullName, email, passwordTooShort, confirm, password, agree, loading]
  );

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      const redirectTo = `${window.location.origin}/auth/callback`; // ✅ fixed template string

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            full_name: fullName,
            phone,
          },
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setEmailSent(true);
        // Optionally keep them here until they confirm; or pre-route to a warm page:
        navigate("/login");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start your farmland investment journey"
    >
      <form onSubmit={handleSignUp} className="space-y-4">
        {/* Full Name */}
        <div className="relative">
          <label htmlFor="fullName" className="sr-only">Full Name</label>
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <User size={18} className="text-gray-400" />
          </div>
          <input
            id="fullName"
            type="text"
            required
            placeholder="Full Name"
            className="w-full rounded-lg border border-gray-200 pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

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

        {/* Phone */}
        <div className="relative">
          <label htmlFor="phone" className="sr-only">Phone Number</label>
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Phone size={18} className="text-gray-400" />
          </div>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            placeholder="+234 801 234 5678"
            className="w-full rounded-lg border border-gray-200 pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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
            type={showPwd ? "text" : "password"}
            required
            placeholder="Create a strong password"
            className={`w-full rounded-lg border ${
              passwordTooShort ? "border-red-300" : "border-gray-200"
            } pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
          />
          <button
            type="button"
            aria-label={showPwd ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
            onClick={() => setShowPwd((s) => !s)}
          >
            {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          {passwordTooShort && (
            <p className="mt-1 text-xs text-red-600">Minimum 8 characters.</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="relative">
          <label htmlFor="confirm" className="sr-only">Confirm Password</label>
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Lock size={18} className="text-gray-400" />
          </div>
          <input
            id="confirm"
            type={showConfirm ? "text" : "password"}
            required
            placeholder="Confirm your password"
            className={`w-full rounded-lg border ${
              mismatch ? "border-red-300" : "border-gray-200"
            } pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
          />
          <button
            type="button"
            aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
            onClick={() => setShowConfirm((s) => !s)}
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          {mismatch && (
            <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
          )}
        </div>

        {/* Terms */}
        <label className="flex items-start gap-3 text-sm text-gray-700 select-none">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            checked={agree}
            onChange={() => setAgree((s) => !s)}
          />
          <span>
            I agree to the{" "}
            <a href="/terms" className="text-emerald-700 hover:underline">
              Terms and Conditions
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-emerald-700 hover:underline">
              Privacy Policy
            </a>.
          </span>
        </label>

        {/* Error & success */}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {emailSent && !error && (
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 size={18} /> Check your email to confirm your account.
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full inline-flex items-center justify-center rounded-lg py-2.5 text-sm font-medium text-white transition
            ${canSubmit ? "bg-emerald-600 hover:bg-emerald-700" : "bg-emerald-400 cursor-not-allowed"}`}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="animate-spin" size={16} /> Creating Account...
            </span>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      {/* Footer links */}
      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link to="/login" className="text-emerald-700 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default SignUp;





