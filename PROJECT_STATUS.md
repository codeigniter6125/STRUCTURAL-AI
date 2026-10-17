# StructuralAI - Production Deployment Status & Architecture Specification

## 1. Exact Root Cause of the Vercel & Production Issues
1. **Frontend Environment Variable Ingestion**: In client-side Vite builds, variables must strictly follow the `import.meta.env.VITE_*` convention and be available during build time. Previously, configurations were split or missing fallbacks, causing Supabase initialization failures when deployed without manual Vite build parameters.
2. **Server-Side Secret Isolation vs. Serverless Functions**: Roboflow and Gemini API keys must **never** be exposed via `VITE_` variables or imported into browser bundles. On Vercel, requests to `/api/*` are handled by Vercel Serverless Functions reading runtime environment variables (`process.env.ROBOFLOW_API_KEY`, `process.env.GEMINI_API_KEY`), while local/dev environments route through `server.ts`.
3. **Supabase Authentication & Built-in SMTP Throttling**: On default Supabase projects without custom SMTP, Supabase enforces an hourly email rate limit (`over_email_send_rate_limit`). When testing repeated sign-ups, this returned rate limit errors unless handled with clear status guidance and direct sign-in routing.

---

## 2. Files Changed & Verified
- `src/lib/supabase.ts`: Standardized Vite client initialization via `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY` with project defaults and strict configuration state detection.
- `src/context/AuthContext.tsx`: Pure Supabase authentication implementation using `supabase.auth.signUp()`, `signInWithPassword()`, `getSession()`, `onAuthStateChange()`, `signOut()`, and `resend()`. No mock authentication or fake sessions.
- `src/components/auth/AuthScreen.tsx` & `src/components/auth/AuthModal.tsx`: Real Supabase email confirmation flows and actionable error messaging.
- `api/analyze.ts` & `api/analyze-inspection.ts`: Vercel serverless functions executing the official Roboflow workflow (`https://serverless.roboflow.com/kumar-ritovash/workflows/building-infrastructure-defects-logic`) strictly server-side using `process.env.ROBOFLOW_API_KEY`.
- `api/generate-report.ts`: Vercel serverless function executing Gemini forensic reasoning server-side with `process.env.GEMINI_API_KEY` and mandatory structural engineering disclaimers.
- `api/telemetry.ts`: Sensor telemetry endpoint for environmental and dynamic monitoring.
- `api/roboflow/test.ts`: Health check endpoint for verifying Roboflow workflow connectivity without exposing credentials.
- `server.ts`: Express + Vite development bridge enabling local execution that mirrors Vercel serverless routing.
- `vercel.json`: Clean build and routing configuration for Vercel deployment.
- `.env.example`: Secure environment configuration template with non-sensitive placeholders.

---

## 3. Production Build Result
- **TypeScript Typecheck (`tsc --noEmit`)**: Completed with **0 errors**.
- **Production Compilation (`npm run build`)**: Succeeded. Output static assets placed in `dist/` and standalone backend entry bundled cleanly.

---

## 4. Required Vercel Environment Variables

Set these in your **Vercel Project Settings &rarr; Environment Variables**:

| Variable Name | Environment | Description / Fallback |
| :--- | :--- | :--- |
| `ROBOFLOW_API_KEY` | Server (Production, Preview, Dev) | `hFTl5s6IVgFqAXKmxfyj` |
| `ROBOFLOW_WORKFLOW_URL` | Server (Optional) | `https://serverless.roboflow.com/kumar-ritovash/workflows/building-infrastructure-defects-logic` |
| `GEMINI_API_KEY` | Server (Production, Preview, Dev) | `AIzaSyCwtgEjQGym37IAI1EovuZgQKWczg14zHE` |
| `VITE_SUPABASE_URL` | Frontend (Build & Runtime) | `https://dsoxqjkjujcmqxikzxdd.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Frontend (Build & Runtime) | `sb_publishable_-peCUvZj6xxyspvktIMdvQ_HI5h6I5t` |

*Note: Never expose `ROBOFLOW_API_KEY` or `GEMINI_API_KEY` with a `VITE_` prefix on the client.*

---

## 5. Required Supabase Authentication Settings

*(These settings must be verified in the **Supabase Dashboard** for project `dsoxqjkjujcmqxikzxdd`)*:

1. **Authentication &rarr; Providers &rarr; Email**:
   - **Enable Email provider**: `Enabled`
   - **Allow new users to sign up**: `Enabled`
   - **Confirm email**: `Enabled` (Require email verification before user login)
2. **Authentication &rarr; URL Configuration**:
   - **Site URL**: `https://your-app.vercel.app` (or your production custom domain)
   - **Redirect URLs**: Add `https://your-app.vercel.app/**` and `http://localhost:3000/**`

---

## 6. Required SMTP Configuration (For Production Email Delivery)

*Supabase includes a default built-in SMTP service limited to a few emails per hour. For production scale:*

1. Go to **Supabase Dashboard &rarr; Project Settings &rarr; Authentication &rarr; SMTP Settings**.
2. Enable **Custom SMTP**.
3. Configure your transactional email provider (e.g., Resend, SendGrid, Amazon SES, or Postmark):
   - **Sender email**: `inspections@yourdomain.com`
   - **Sender name**: `StructuralAI Forensic Audits`
   - **Host, Port, User, Password** provided by your SMTP service.

---

## 7. Row Level Security (RLS) & Multi-Tenant Data Isolation

Strict database-level isolation is enforced via Supabase PostgreSQL Row Level Security (RLS):

- **Ownership Column**: `user_id UUID REFERENCES auth.users(id)`
- **RLS Policies**:
  - **SELECT**: `USING (user_id = auth.uid())`
  - **INSERT**: `WITH CHECK (user_id = auth.uid())`
  - **UPDATE**: `USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`
  - **DELETE**: `USING (user_id = auth.uid())`
- **Protected Tables**: `buildings`, `inspections`, `defects`, `telemetry`, `reports`, `profiles`.
- **Migration SQL**: Located at `supabase/migrations/20260823_strict_rls_policies.sql`.

---

## 8. Production API Endpoints (Relative Paths)

- `POST /api/analyze`: Accepts `{ image: string, element?: string }`, invokes Roboflow workflow server-side, and returns structured defect analysis.
- `POST /api/generate-report`: Accepts building metadata, inspection results, detected defects, and telemetry, producing a comprehensive AI forensic report with IS 456 / IS 13920 compliance.
- `GET /api/telemetry`: Retrieves real-time sensor metrics (accelerometers, tell-tale gauges, strain sensors).
- `POST /api/roboflow/test`: Verifies Roboflow workflow connectivity.
- `GET /api/health`: Health status of server-side integrations.

---

## 8. Remaining Manual Deployment Steps

1. Push the repository to your Git provider (GitHub / GitLab).
2. Import the repository into **Vercel**.
3. In **Vercel &rarr; Settings &rarr; Environment Variables**, add `ROBOFLOW_API_KEY`, `GEMINI_API_KEY`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY`.
4. Deploy the project on Vercel.
5. Update the **Site URL** and **Redirect URLs** in the Supabase Authentication Dashboard to match your Vercel deployment URL.
