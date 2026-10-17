import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  Building2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const {
    signIn,
    signUp,
    resetPassword,
    resendConfirmationEmail,
    emailConfirmationPending,
    clearEmailConfirmationPending,
    isSupabaseLive,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Senior Structural Auditor (Grade I)');
  const [organization, setOrganization] = useState('Central Public Works Dept (CPWD)');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  // Active timer for resend rate limit cooldown
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      if (mode === 'signin') {
        const res = await signIn(email, password);
        if (res.error) {
          setError(res.error);
        }
      } else if (mode === 'signup') {
        const res = await signUp({
          email,
          password,
          fullName: fullName.trim() || email.split('@')[0],
          role: role.trim(),
          organization: organization.trim(),
          badgeNumber: badgeNumber.trim() || `CPWD-${Math.floor(1000 + Math.random() * 9000)}`,
        });
        if (res.error) {
          setError(res.error);
        } else if (res.requireEmailConfirmation) {
          setSuccessMsg(
            res.message || 'Account created. Please check your email and confirm your account before signing in.'
          );
        } else if (res.message) {
          setSuccessMsg(res.message);
        }
      } else if (mode === 'forgot') {
        const res = await resetPassword(email);
        if (res.error) {
          setError(res.error);
        } else {
          setSuccessMsg(res.message || 'Password reset instructions have been dispatched to your email.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected authentication error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    const targetEmail = emailConfirmationPending || email;
    if (!targetEmail || cooldownSeconds > 0) return;
    setResending(true);
    setError(null);
    try {
      const res = await resendConfirmationEmail(targetEmail);
      if (res.error) {
        // Parse Supabase rate-limiting string if present (e.g. "...after 26 seconds")
        const secMatch = res.error.match(/(\d+)\s*seconds?/i);
        if (secMatch) {
          const secs = parseInt(secMatch[1], 10);
          setCooldownSeconds(secs);
          setError(`Security cooldown active. You can request another verification email in ${secs}s.`);
        } else {
          setError(res.error);
        }
      } else {
        setCooldownSeconds(60);
        setSuccessMsg(res.message || 'Verification email resent successfully. Please check your inbox.');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-[#0B192C] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header Branding */}
        <div className="bg-[#0B192C] px-8 py-6 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight">StructuralAI</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-semibold uppercase">
                  IS 456 / CPWD
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Indian Infrastructure Health & Defect Intelligence Portal
              </p>
            </div>
          </div>
        </div>

        {/* Email Confirmation Screen if Confirmation is Pending */}
        {emailConfirmationPending ? (
          <div className="p-8 space-y-5 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Mail className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Confirm Your Email Address</h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Account created. A verification link has been dispatched to{' '}
                <strong className="text-slate-900 font-mono">{emailConfirmationPending}</strong>. Please check your email and confirm your account before signing in.
              </p>
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 text-left">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={resending || cooldownSeconds > 0}
                onClick={handleResend}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Resending...</span>
                  </>
                ) : cooldownSeconds > 0 ? (
                  <>
                    <Clock className="w-4 h-4 text-blue-200" />
                    <span>Resend available in {cooldownSeconds}s</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Resend Confirmation Email</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  clearEmailConfirmationPending();
                  setMode('signin');
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 space-y-6">
            {/* Missing Supabase Configuration Alert */}
            {!isSupabaseLive && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-950">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Supabase Environment Configuration Required</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Supabase credentials (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-bold">VITE_SUPABASE_URL</code> and <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-bold">VITE_SUPABASE_ANON_KEY</code>) are missing from your environment.
                </p>
                <div className="text-[11px] bg-amber-100/70 p-2.5 rounded-xl border border-amber-200 text-amber-950 space-y-1">
                  <div className="font-semibold">To configure for Vercel / Production:</div>
                  <ol className="list-decimal list-inside space-y-0.5 text-[10px]">
                    <li>Open your Vercel Dashboard &rarr; Project Settings &rarr; Environment Variables</li>
                    <li>Add <span className="font-mono font-bold">VITE_SUPABASE_URL</span></li>
                    <li>Add <span className="font-mono font-bold">VITE_SUPABASE_ANON_KEY</span></li>
                    <li>Trigger a new deployment or redeploy</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Mode Switcher Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  mode === 'signin'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  mode === 'signup'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
                {(error.toLowerCase().includes('rate limit') || error.toLowerCase().includes('already exists') || error.toLowerCase().includes('already registered')) && mode !== 'signin' && (
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setError(null);
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-[11px] transition-colors shadow-xs"
                    >
                      Switch to Sign In &rarr;
                    </button>
                  </div>
                )}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Full Name & Title
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Er. Arjun Sharma"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Professional Role
                      </label>
                      <input
                        type="text"
                        required
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="Senior Structural Auditor"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Badge / License ID
                      </label>
                      <input
                        type="text"
                        value={badgeNumber}
                        onChange={(e) => setBadgeNumber(e.target.value)}
                        placeholder="CPWD-AUD-8821"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Organization / Agency
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="Central Public Works Dept (CPWD)"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="inspector@cpwd.gov.in"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Password</label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setError(null);
                          setSuccessMsg(null);
                        }}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === 'signin'
                        ? 'Sign In to StructuralAI'
                        : mode === 'signup'
                        ? 'Create Engineer Account'
                        : 'Send Password Reset Link'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {mode === 'forgot' && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
                >
                  &larr; Back to Sign In
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-slate-400 text-xs font-mono">
        IS 456:2000 &bull; IS 13920:2016 &bull; Roboflow Computer Vision &bull; Supabase RLS
      </div>
    </div>
  );
};
