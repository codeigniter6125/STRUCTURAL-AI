-- ==============================================================================
-- STRUCTURALAI: STRICT PER-USER ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Run this SQL in your Supabase SQL Editor (https://app.supabase.com)
-- This script enables RLS on all tables and creates strict policies ensuring
-- that authenticated users can ONLY SELECT, INSERT, UPDATE, and DELETE
-- their own registered data (where user_id = auth.uid()).
-- ==============================================================================

-- 1. BUILDINGS TABLE
CREATE TABLE IF NOT EXISTS public.buildings (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  custom_type TEXT,
  address TEXT,
  locality TEXT,
  city TEXT,
  state TEXT,
  year_built INTEGER,
  total_floors INTEGER,
  building_use TEXT,
  owner_name TEXT,
  structural_system TEXT,
  total_inspections INTEGER DEFAULT 0,
  health_index NUMERIC DEFAULT 100,
  risk_status TEXT DEFAULT 'Unassessed',
  critical_defects_count INTEGER DEFAULT 0,
  active_remediations INTEGER DEFAULT 0,
  thumbnail TEXT,
  contact_officer JSONB,
  key_elements JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure user_id column exists if table was created previously
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'buildings' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.buildings ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
  END IF;
END $$;

-- Enable Row Level Security on buildings
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;

-- Drop any previous or conflicting policies
DROP POLICY IF EXISTS "Users can view their own buildings" ON public.buildings;
DROP POLICY IF EXISTS "Users can insert their own buildings" ON public.buildings;
DROP POLICY IF EXISTS "Users can update their own buildings" ON public.buildings;
DROP POLICY IF EXISTS "Users can delete their own buildings" ON public.buildings;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.buildings;

-- CREATE STRICT POLICIES FOR BUILDINGS
CREATE POLICY "Users can view their own buildings"
  ON public.buildings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own buildings"
  ON public.buildings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own buildings"
  ON public.buildings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own buildings"
  ON public.buildings
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_buildings_user_id ON public.buildings(user_id);
CREATE INDEX IF NOT EXISTS idx_buildings_code ON public.buildings(code);


-- 2. INSPECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.inspections (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  building_id TEXT,
  inspection_code TEXT NOT NULL,
  building_name TEXT,
  building_code TEXT,
  element TEXT,
  location_details TEXT,
  inspector_name TEXT,
  inspector_badge TEXT,
  inspector_role TEXT,
  date TEXT,
  status TEXT,
  structural_health_index NUMERIC,
  risk_score NUMERIC,
  overall_risk_level TEXT,
  total_defect_coverage_percent NUMERIC,
  diagnosis_summary TEXT,
  safety_precautions JSONB,
  defects JSONB,
  original_image TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'inspections' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.inspections ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
  END IF;
END $$;

ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can insert their own inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can update their own inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can delete their own inspections" ON public.inspections;

CREATE POLICY "Users can view their own inspections"
  ON public.inspections
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own inspections"
  ON public.inspections
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own inspections"
  ON public.inspections
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own inspections"
  ON public.inspections
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_inspections_user_id ON public.inspections(user_id);
CREATE INDEX IF NOT EXISTS idx_inspections_building_id ON public.inspections(building_id);


-- 3. DEFECTS TABLE
CREATE TABLE IF NOT EXISTS public.defects (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  inspection_id TEXT,
  building_id TEXT,
  type TEXT,
  confidence NUMERIC,
  severity TEXT,
  box2d JSONB,
  estimated_length_mm NUMERIC,
  estimated_width_mm NUMERIC,
  coverage_percent NUMERIC,
  technical_description TEXT,
  standards_reference TEXT,
  remediation_protocol TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'defects' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.defects ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
  END IF;
END $$;

ALTER TABLE public.defects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own defects" ON public.defects;
DROP POLICY IF EXISTS "Users can insert their own defects" ON public.defects;
DROP POLICY IF EXISTS "Users can update their own defects" ON public.defects;
DROP POLICY IF EXISTS "Users can delete their own defects" ON public.defects;

CREATE POLICY "Users can view their own defects"
  ON public.defects
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own defects"
  ON public.defects
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own defects"
  ON public.defects
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own defects"
  ON public.defects
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_defects_user_id ON public.defects(user_id);


-- 4. TELEMETRY TABLE
CREATE TABLE IF NOT EXISTS public.telemetry (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  building_id TEXT,
  sensor_id TEXT,
  element_code TEXT,
  metric_type TEXT,
  reading_value NUMERIC,
  unit TEXT,
  threshold_warning NUMERIC,
  threshold_critical NUMERIC,
  status TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'telemetry' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.telemetry ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
  END IF;
END $$;

ALTER TABLE public.telemetry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own telemetry" ON public.telemetry;
DROP POLICY IF EXISTS "Users can insert their own telemetry" ON public.telemetry;
DROP POLICY IF EXISTS "Users can update their own telemetry" ON public.telemetry;
DROP POLICY IF EXISTS "Users can delete their own telemetry" ON public.telemetry;

CREATE POLICY "Users can view their own telemetry"
  ON public.telemetry
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own telemetry"
  ON public.telemetry
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own telemetry"
  ON public.telemetry
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own telemetry"
  ON public.telemetry
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_telemetry_user_id ON public.telemetry(user_id);


-- 5. REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  inspection_id TEXT,
  building_id TEXT,
  report_number TEXT,
  title TEXT,
  audit_standard TEXT,
  status TEXT,
  certified_by TEXT,
  certificate_hash TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.reports ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
  END IF;
END $$;

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can insert their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can update their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can delete their own reports" ON public.reports;

CREATE POLICY "Users can view their own reports"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own reports"
  ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reports"
  ON public.reports
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own reports"
  ON public.reports
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);


-- 6. PROFILES TABLE (User metadata synchronization)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  organization TEXT,
  badge_number TEXT,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());
