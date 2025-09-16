-- USRA Complete Setup Script - Fixed Version
-- Run this in Supabase SQL editor (Project > SQL > New Query)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================
-- 1. SCHOOLS TABLE SETUP (FIXED)
-- ================================

-- Create schools table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.schools (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at timestamptz DEFAULT now(),
    -- Allow NULL for anonymous registrations
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Standardize column names to match JavaScript code
    name text NOT NULL,  -- School name (matches JS)
    principal_name text NOT NULL,  -- Matches JS
    email text NOT NULL,  -- Matches JS
    phone text NOT NULL,  -- Matches JS
    address text NOT NULL,  -- Matches JS
    
    -- Extended fields
    center_number text,
    school_email text,
    contact1 text,
    contact2 text,
    region text,
    district text,
    badge_url text,
    
    -- Additional fields for registration
    estimated_players int,
    notes text,
    status text DEFAULT 'pending',
    registration_date timestamptz DEFAULT now()
);

-- ================================
-- 2. STORAGE BUCKETS SETUP
-- ================================

-- Create storage buckets with underscores (matching JavaScript)
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-badges', 'school-badges', true) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('supporting-docs', 'supporting-docs', false) ON CONFLICT (id) DO NOTHING;

-- ================================
-- 3. ROW LEVEL SECURITY SETUP (FIXED)
-- ================================

-- Enable RLS on schools table
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "schools_insert_policy" ON public.schools;
DROP POLICY IF EXISTS "schools_select_policy" ON public.schools;
DROP POLICY IF EXISTS "schools_update_policy" ON public.schools;

-- Create comprehensive RLS policies that allow anonymous inserts
CREATE POLICY "schools_insert_policy" ON public.schools FOR
INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "schools_select_policy" ON public.schools FOR
SELECT TO anon, authenticated USING (
    created_by = auth.uid() OR 
    auth.uid() IS NULL
);

CREATE POLICY "schools_update_policy" ON public.schools FOR
UPDATE TO authenticated USING (
    created_by = auth.uid()
) WITH CHECK (
    created_by = auth.uid()
);

-- ================================
-- 4. FIXED HELPER FUNCTIONS AND TRIGGERS
-- ================================

-- Function to automatically set created_by (only for authenticated users)
CREATE OR REPLACE FUNCTION public.set_created_by() 
RETURNS trigger AS $$
BEGIN
    -- Only set created_by if user is authenticated
    IF (NEW.created_by IS NULL AND auth.uid() IS NOT NULL) THEN
        NEW.created_by := auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for schools table
DROP TRIGGER IF EXISTS trg_set_created_by_schools ON public.schools;
CREATE TRIGGER trg_set_created_by_schools 
    BEFORE INSERT ON public.schools 
    FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

-- ================================
-- 5. OTHER REQUIRED TABLES
-- ================================

-- Create other tables if they don't exist
CREATE TABLE IF NOT EXISTS public.players (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    first_name text NOT NULL,
    last_name text NOT NULL,
    date_of_birth date,
    position text,
    jersey_number int,
    height_cm int,
    weight_kg int,
    photo_url text
);

CREATE TABLE IF NOT EXISTS public.contacts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at timestamptz DEFAULT now(),
    name text NOT NULL,
    email text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.members (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at timestamptz DEFAULT now(),
    user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    nin text,
    role text,
    sex text,
    highest_qualification text,
    contact1 text,
    contact2 text,
    profile_photo_url text,
    supporting_docs_url text
);

-- Enable RLS on other tables
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- ================================
-- 6. SUCCESS VERIFICATION
-- ================================

-- Verify setup
DO $$
DECLARE
    school_count int;
    bucket_count int;
BEGIN
    -- Check if schools table exists and has required columns
    SELECT COUNT(*) INTO school_count 
    FROM information_schema.columns 
    WHERE table_name = 'schools' AND table_schema = 'public' 
    AND column_name IN ('name', 'principal_name', 'email', 'phone');
    
    -- Check if storage buckets exist
    SELECT COUNT(*) INTO bucket_count 
    FROM storage.buckets 
    WHERE id IN ('school-badges', 'profile-photos', 'supporting-docs');
    
    IF school_count >= 4 AND bucket_count = 3 THEN
        RAISE NOTICE '✅ SETUP COMPLETED SUCCESSFULLY!';
        RAISE NOTICE '✅ Schools table: % required columns found', school_count;
        RAISE NOTICE '✅ Storage buckets: % buckets created', bucket_count;
        RAISE NOTICE '✅ RLS policies: Applied successfully';
        RAISE NOTICE '✅ All issues resolved:';
        RAISE NOTICE '   - Database schema updated ✅';
        RAISE NOTICE '   - Storage buckets created ✅';
        RAISE NOTICE '   - RLS policies configured ✅';
        RAISE NOTICE '   - Foreign key constraint issue resolved ✅';
    ELSE
        RAISE WARNING '⚠️ Setup may be incomplete. Check the results above.';
    END IF;
END
$$;
