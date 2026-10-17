-- ==============================================================================
-- StructuralAI - Supabase Database Schema & Row-Level Security (RLS)
-- Compliance: IS 456:2000, IS 13920:2016, IRC 112:2020, CPWD Maintenance Manual
-- ==============================================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'Field Structural Engineer',
    organization TEXT DEFAULT 'Central Public Works Dept (CPWD)',
    badge_number TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BUILDINGS TABLE
CREATE TABLE IF NOT EXISTS public.buildings (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- Residential, Commercial, Industrial, Hospital, School, Government, Other
    custom_type TEXT,
    address TEXT,
    locality TEXT,
    city TEXT DEFAULT 'Shahdara',
    state TEXT DEFAULT 'Delhi NCR',
    year_built INTEGER,
    total_floors TEXT,
    building_use TEXT,
    owner_name TEXT,
    structural_system TEXT DEFAULT 'Reinforced Concrete (RCC) Moment Resisting Frame',
    total_inspections INTEGER DEFAULT 0,
    health_index INTEGER DEFAULT 100,
    risk_status TEXT DEFAULT 'Unassessed', -- 'Unassessed', 'Low', 'Moderate', 'High', 'Critical'
    critical_defects_count INTEGER DEFAULT 0,
    active_remediations INTEGER DEFAULT 0,
    thumbnail TEXT,
    contact_officer JSONB DEFAULT '{"name": "Zonal Executive Engineer", "title": "Divisional Lead", "phone": "+91 11 2233 4455", "agency": "EDMC / CPWD Delhi Circle"}'::jsonb,
    key_elements JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INSPECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.inspections (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    inspection_code TEXT NOT NULL,
    building_id TEXT REFERENCES public.buildings(id) ON DELETE CASCADE,
    building_name TEXT NOT NULL,
    building_code TEXT NOT NULL,
    element TEXT NOT NULL,
    location_details TEXT,
    inspector_name TEXT NOT NULL,
    inspector_badge TEXT,
    inspector_role TEXT,
    date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'Completed', -- 'Pending', 'Completed', 'Under Remediation', 'Verified'
    structural_health_index INTEGER DEFAULT 100,
    risk_score INTEGER DEFAULT 0,
    overall_risk_level TEXT DEFAULT 'Low', -- 'Low', 'Moderate', 'High', 'Critical'
    total_defect_coverage_percent NUMERIC(5,2) DEFAULT 0.0,
    diagnosis_summary TEXT,
    safety_precautions TEXT[],
    defects JSONB DEFAULT '[]'::jsonb,
    original_image TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DEFECTS TABLE (Itemized photogrammetry & crack detections)
CREATE TABLE IF NOT EXISTS public.defects (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    inspection_id TEXT REFERENCES public.inspections(id) ON DELETE CASCADE,
    building_id TEXT REFERENCES public.buildings(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    confidence NUMERIC(5,2) DEFAULT 95.0,
    severity TEXT NOT NULL, -- 'Low', 'Moderate', 'High', 'Critical'
    box2d NUMERIC[] NOT NULL, -- [ymin, xmin, ymax, xmax] 0-1000
    estimated_length_mm NUMERIC(8,2),
    estimated_width_mm NUMERIC(6,2),
    coverage_percent NUMERIC(5,2),
    technical_description TEXT,
    standards_reference TEXT,
    remediation_protocol TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TELEMETRY TABLE (Vibrating wire strain, tiltmeter, ambient vibration)
CREATE TABLE IF NOT EXISTS public.telemetry (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    building_id TEXT REFERENCES public.buildings(id) ON DELETE CASCADE,
    sensor_id TEXT NOT NULL,
    element_code TEXT NOT NULL,
    metric_type TEXT NOT NULL, -- 'Microstrain (με)', 'Crack Displacement (mm)', 'Inclination (deg)', 'Peak Particle Velocity (mm/s)'
    reading_value NUMERIC(10,4) NOT NULL,
    unit TEXT NOT NULL,
    threshold_warning NUMERIC(10,4),
    threshold_critical NUMERIC(10,4),
    status TEXT DEFAULT 'Normal', -- 'Normal', 'Warning', 'Critical'
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. REPORTS TABLE (Certified IS 456 / CPWD Audit Certificates)
CREATE TABLE IF NOT EXISTS public.reports (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    inspection_id TEXT REFERENCES public.inspections(id) ON DELETE SET NULL,
    building_id TEXT REFERENCES public.buildings(id) ON DELETE CASCADE,
    report_number TEXT NOT NULL,
    title TEXT NOT NULL,
    audit_standard TEXT DEFAULT 'IS 456:2000 & CPWD Maintenance Manual',
    status TEXT DEFAULT 'Certified', -- 'Draft', 'Under Review', 'Certified', 'Remediation Mandated'
    certified_by TEXT NOT NULL,
    certificate_hash TEXT,
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- Every user only reads, inserts, updates, and deletes their own rows.
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR auth.uid() = user_id)
    WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

-- Buildings Policies
CREATE POLICY "Users can view their own buildings"
    ON public.buildings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own buildings"
    ON public.buildings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own buildings"
    ON public.buildings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own buildings"
    ON public.buildings FOR DELETE
    USING (auth.uid() = user_id);

-- Inspections Policies
CREATE POLICY "Users can view their own inspections"
    ON public.inspections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inspections"
    ON public.inspections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inspections"
    ON public.inspections FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inspections"
    ON public.inspections FOR DELETE
    USING (auth.uid() = user_id);

-- Defects Policies
CREATE POLICY "Users can view their own defects"
    ON public.defects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own defects"
    ON public.defects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update/delete their own defects"
    ON public.defects FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Telemetry Policies
CREATE POLICY "Users can access their own telemetry"
    ON public.telemetry FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Reports Policies
CREATE POLICY "Users can access their own reports"
    ON public.reports FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- SUPABASE STORAGE BUCKET: structural-images
-- ==============================================================================
-- In Supabase Storage SQL Editor:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('structural-images', 'structural-images', true)
-- ON CONFLICT (id) DO UPDATE SET public = true;

-- CREATE POLICY "Allow authenticated users to upload structural images"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'structural-images' AND (auth.uid()::text = (storage.foldername(name))[1] OR auth.role() = 'authenticated'));

-- CREATE POLICY "Allow public read of structural images"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'structural-images');
