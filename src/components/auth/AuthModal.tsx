import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  Building2,
  BadgeCheck,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  LogOut,
  X,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    isLoading,
    isSupabaseLive,
    emailConfirmationPending,
    signIn,
    signUp,
    signOut,
    resetPassword,
    resendConfirmationEmail,
    clearEmailConfirmationPending,
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

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  if (!isOpen) return null;

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
        } else {
          onClose();
        }
      } else if (mode === 'signup') {
        const res = await signUp({
          email,
          password,
          fullName: fullName || email.split('@')[0],
          role,
          organization,
          badgeNumber: badgeNumber || `CPWD-${Math.floor(1000 + Math.random() * 9000)}`,
        });
        if (res.error) {
          setError(res.error);
        } else if (res.requireEmailConfirmation) {
          setSuccessMsg('Confirmation link has been dispatched to your email address.');
        } else {
          onClose();
        }
      } else if (mode === 'forgot') {
        const res = await resetPassword(email);
        if (res.error) {
          setError(res.error);
        } else {
          setSuccessMsg(res.message || 'Password reset link sent.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.');
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
        const secMatch = res.error.match(/(\d+)\s*seconds?/i);
        if (secMatch) {
          const secs = parseInt(secMatch[1], 10);
          setCooldownSeconds(secs);
          setError(`Security cooldown active. You can request another email in ${secs}s.`);
        } else {
          setError(res.error);
        }
      } else {
        setCooldownSeconds(60);
        setSuccessMsg(res.message || 'Verification link re-sent.');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="bg-[#0B192C] px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight">StructuralAI Account</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  IS 456 / Supabase
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Certified Civil Infrastructure Health Portal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User is signed in profile details */}
        {user ? (
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="h-12 w-12 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-base">
                {user.fullName?.charAt(0) || 'E'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm text-slate-900 truncate">{user.fullName}</h4>
                  <BadgeCheck className="w-4 h-4 text-blue-600 shrink-0" />
                </div>
                <p className="text-xs text-slate-600 truncate">{user.role}</p>
                <p className="text-[11px] text-slate-400 font-mono">{user.email} &bull; {user.badgeNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] uppercase font-semibold text-slate-500">Organization</div>
                <div className="font-bold text-slate-900 mt-0.5 truncate">{user.organization}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] uppercase font-semibold text-slate-500">Account ID</div>
                <div className="font-bold font-mono text-slate-900 mt-0.5 truncate">{user.id}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                await signOut();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out from StructuralAI</span>
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Mode Switcher */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  mode === 'signin' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  mode === 'signup' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                Create Account
              </button>
            </div>

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

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Er. Arjun Sharma"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Role / Designation</label>
                    <input
                      type="text"
                      required
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="Senior Structural Auditor"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="auditor@cpwd.gov.in"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
