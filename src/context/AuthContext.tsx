import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AuthUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isSupabaseLive: boolean;
  emailConfirmationPending: string | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (data: {
    email: string;
    password: string;
    fullName: string;
    role: string;
    organization: string;
    badgeNumber?: string;
  }) => Promise<{ error?: string; requireEmailConfirmation?: boolean; message?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string; message?: string }>;
  resendConfirmationEmail: (email: string) => Promise<{ error?: string; message?: string }>;
  clearEmailConfirmationPending: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [emailConfirmationPending, setEmailConfirmationPending] = useState<string | null>(null);

  // Helper to map Supabase user object to AuthUser
  const mapSupabaseUser = useCallback((sbUser: any): AuthUser => {
    return {
      id: sbUser.id,
      email: sbUser.email || '',
      fullName:
        sbUser.user_metadata?.full_name ||
        sbUser.user_metadata?.name ||
        sbUser.email?.split('@')[0] ||
        'Inspector',
      role: sbUser.user_metadata?.role || 'Senior Structural Auditor',
      organization: sbUser.user_metadata?.organization || 'Central Public Works Dept (CPWD)',
      badgeNumber: sbUser.user_metadata?.badge_number || `CPWD-${sbUser.id.slice(0, 6).toUpperCase()}`,
      confirmedAt: sbUser.confirmed_at || sbUser.email_confirmed_at || undefined,
      lastSignInAt: sbUser.last_sign_in_at || new Date().toISOString(),
    };
  }, []);

  // Initialize session on mount via Supabase Auth getSession()
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        if (!isSupabaseConfigured) {
          console.warn('Supabase URL/Key is not configured. User must configure Supabase to sign in.');
          if (isMounted) {
            setUser(null);
            setIsLoading(false);
          }
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Supabase getSession error:', error.message);
        }

        if (isMounted) {
          if (session?.user) {
            setUser(mapSupabaseUser(session.user));
          } else {
            setUser(null);
          }
        }
      } catch (err: any) {
        console.error('Auth initialization error:', err?.message || err);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();

    // Keep session synchronized strictly via Supabase onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [mapSupabaseUser]);

  // Sign In using Supabase signInWithPassword
  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured) {
        return {
          error: 'Supabase credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing in environment configuration.',
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.warn('Supabase signInWithPassword:', error.message);
        if (error.message.toLowerCase().includes('email not confirmed')) {
          setEmailConfirmationPending(email.trim());
          return { error: 'Please check your inbox and confirm your email address before signing in.' };
        }
        return { error: error.message };
      }

      if (data.user) {
        setUser(mapSupabaseUser(data.user));
        setEmailConfirmationPending(null);
        return {};
      }

      return { error: 'Sign in completed without returning a valid user session.' };
    } catch (err: any) {
      console.error('Sign in exception:', err?.message || err);
      return { error: err?.message || 'Failed to sign in. Please check your credentials.' };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Up using Supabase signUp
  const signUp = async ({
    email,
    password,
    fullName,
    role,
    organization,
    badgeNumber,
  }: {
    email: string;
    password: string;
    fullName: string;
    role: string;
    organization: string;
    badgeNumber?: string;
  }): Promise<{ error?: string; requireEmailConfirmation?: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured) {
        return {
          error: 'Supabase credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing in environment configuration.',
        };
      }

      const formattedBadgeNumber = badgeNumber?.trim() || `CPWD-${Math.floor(1000 + Math.random() * 9000)}`;

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: role.trim(),
            organization: organization.trim(),
            badge_number: formattedBadgeNumber,
          },
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });

      if (error) {
        const lowerMsg = (error.message || '').toLowerCase();
        if (lowerMsg.includes('rate limit') || lowerMsg.includes('over_email_send_rate_limit')) {
          console.warn('Supabase sign-up email rate limit reached. Checking if user account already exists...');
          // Try signing in in case the account was already provisioned
          try {
            const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
              email: email.trim(),
              password,
            });
            if (!signInErr && signInData.user && signInData.session) {
              setUser(mapSupabaseUser(signInData.user));
              setEmailConfirmationPending(null);
              return { message: 'Account signed in successfully.' };
            }
            if (signInErr && (signInErr.message.toLowerCase().includes('email not confirmed') || signInErr.message.toLowerCase().includes('not confirmed'))) {
              setEmailConfirmationPending(email.trim());
              return {
                requireEmailConfirmation: true,
                message: 'Your account was already created! Verification emails are temporarily throttled by Supabase. Please check your inbox or spam for the previously sent confirmation link.',
              };
            }
          } catch {
            // Silently ignore fallback sign-in attempt errors
          }

          return {
            error: 'Supabase email rate limit reached. If your account was already created, please Switch to Sign In. Otherwise, check your inbox/spam for a previously received confirmation link, or wait a few minutes before retrying.',
          };
        }

        if (lowerMsg.includes('user already registered') || lowerMsg.includes('already exists')) {
          console.warn('Supabase signUp: user already registered.');
          return {
            error: 'An account with this email address already exists. Please switch to Sign In.',
          };
        }

        console.warn('Supabase signUp:', error.message);
        return { error: error.message };
      }

      // If user was created but session is null, email confirmation is required
      if (data.user && !data.session) {
        setEmailConfirmationPending(email.trim());
        return {
          requireEmailConfirmation: true,
          message: 'Account created. Please check your email and confirm your account before signing in.',
        };
      }

      // If user was created and session is already active (e.g. auto-confirm enabled in Supabase)
      if (data.user && data.session) {
        setUser(mapSupabaseUser(data.user));
        setEmailConfirmationPending(null);
        return { message: 'Account created and verified successfully.' };
      }

      return { error: 'Sign up response was incomplete. Please verify your Supabase project settings.' };
    } catch (err: any) {
      console.error('Sign up exception:', err?.message || err);
      return { error: err?.message || 'Sign up encountered an unexpected error.' };
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password using Supabase resetPasswordForEmail
  const resetPassword = async (email: string): Promise<{ error?: string; message?: string }> => {
    try {
      if (!isSupabaseConfigured) {
        return {
          error: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
        };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : undefined,
      });

      if (error) {
        console.warn('Supabase resetPassword:', error.message);
        const lowerMsg = (error.message || '').toLowerCase();
        if (lowerMsg.includes('rate limit') || lowerMsg.includes('over_email_send_rate_limit')) {
          return { error: 'Email rate limit exceeded. Please wait a few minutes before requesting another password reset email.' };
        }
        return { error: error.message };
      }

      return { message: `Password reset instructions have been sent to ${email.trim()}. Please check your inbox.` };
    } catch (err: any) {
      console.warn('Reset password exception:', err?.message || err);
      return { error: err?.message || 'Failed to dispatch reset email.' };
    }
  };

  // Resend email confirmation using Supabase resend
  const resendConfirmationEmail = async (email: string): Promise<{ error?: string; message?: string }> => {
    try {
      if (!isSupabaseConfigured) {
        return {
          error: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
        };
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });

      if (error) {
        console.warn('Supabase resend confirmation:', error.message);
        const lowerMsg = (error.message || '').toLowerCase();
        if (lowerMsg.includes('rate limit') || lowerMsg.includes('over_email_send_rate_limit')) {
          return { error: 'Email rate limit exceeded. Please wait a few minutes before requesting another verification email, or check your spam/junk folder.' };
        }
        return { error: error.message };
      }

      return { message: `Confirmation email has been resent to ${email.trim()}. Please check your inbox.` };
    } catch (err: any) {
      console.error('Resend confirmation exception:', err?.message || err);
      return { error: err?.message || 'Failed to resend confirmation email.' };
    }
  };

  // Sign out strictly via Supabase signOut()
  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Supabase signOut error:', error.message);
        }
      }
    } catch (err: any) {
      console.error('Sign out exception:', err?.message || err);
    } finally {
      setUser(null);
      setEmailConfirmationPending(null);
      setIsLoading(false);
    }
  };

  const clearEmailConfirmationPending = useCallback(() => {
    setEmailConfirmationPending(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isSupabaseLive: isSupabaseConfigured,
        emailConfirmationPending,
        signIn,
        signUp,
        signOut,
        resetPassword,
        resendConfirmationEmail,
        clearEmailConfirmationPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
