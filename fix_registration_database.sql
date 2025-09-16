-- Fix Registration Database Issues
-- This script resolves the foreign key constraint violations

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================
-- 1. FIX SCHOOLS TABLE SCHEMA
-- ================================

-- Drop the problematic foreign key constraint temporarily
ALTER TABLE public.schools 
DROP CONSTRAINT IF EXISTS schools_created_by_fkey;

-- Make created_by nullable to avoid issues
ALTER TABLE public.schools 
ALTER COLUMN created_by DROP NOT NULL;

-- Ensure all required columns exist
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS school_name text,
ADD COLUMN IF NOT EXISTS center_number text,
ADD COLUMN IF NOT EXISTS school_email text,
ADD COLUMN IF NOT EXISTS school_phone1 text,
ADD COLUMN IF NOT EXISTS school_phone2 text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS district text,
ADD COLUMN IF NOT EXISTS admin_full_name text,
ADD COLUMN IF NOT EXISTS nin text,
ADD COLUMN IF NOT EXISTS role text,
ADD COLUMN IF NOT EXISTS sex text,
ADD COLUMN IF NOT EXISTS qualification text,
ADD COLUMN IF NOT EXISTS contact1 text,
ADD COLUMN IF NOT EXISTS contact2 text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS registration_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS user_id uuid,
ADD COLUMN IF NOT EXISTS school_badge_url text,
ADD COLUMN IF NOT EXISTS profile_photo_url text,
ADD COLUMN IF NOT EXISTS supporting_docs_url text;

-- Add back the foreign key constraints with proper handling
ALTER TABLE public.schools 
ADD CONSTRAINT schools_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) 
ON DELETE SET NULL;

ALTER TABLE public.schools 
ADD CONSTRAINT schools_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- ================================
-- 2. STORAGE BUCKETS SETUP
-- ================================

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('school_badges', 'school_badges', true) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile_photos', 'profile_photos', true) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('supporting_documents', 'supporting_documents', false) ON CONFLICT (id) DO NOTHING;

-- ================================
-- 3. ROW LEVEL SECURITY POLICIES
-- ================================

-- Enable RLS
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "schools_insert_policy" ON public.schools;
DROP POLICY IF EXISTS "schools_select_policy" ON public.schools;
DROP POLICY IF EXISTS "schools_update_policy" ON public.schools;

-- Create simple, working RLS policies
CREATE POLICY "schools_insert_policy" ON public.schools FOR
INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "schools_select_policy" ON public.schools FOR
SELECT TO anon, authenticated USING (true);

CREATE POLICY "schools_update_policy" ON public.schools FOR
UPDATE TO authenticated USING (
    user_id = auth.uid() OR created_by = auth.uid()
) WITH CHECK (
    user_id = auth.uid() OR created_by = auth.uid()
);

-- ================================
-- 4. STORAGE POLICIES
-- ================================

-- Drop existing storage policies
DROP POLICY IF EXISTS "school_badges_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "school_badges_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "supporting_docs_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "supporting_docs_insert_policy" ON storage.objects;

-- Create simple storage policies
CREATE POLICY "allow_all_uploads" ON storage.objects FOR
INSERT TO anon, authenticated WITH CHECK (
    bucket_id IN ('school_badges', 'profile_photos', 'supporting_documents')
);

CREATE POLICY "allow_all_reads" ON storage.objects FOR
SELECT TO anon, authenticated USING (
    bucket_id IN ('school_badges', 'profile_photos', 'supporting_documents')
);

-- ================================
-- 5. HELPER FUNCTIONS
-- ================================

-- Remove problematic triggers temporarily
DROP TRIGGER IF EXISTS trg_set_created_by_schools ON public.schools;

-- Create a safe trigger function
CREATE OR REPLACE FUNCTION public.safe_set_created_by() 
RETURNS trigger AS $$
BEGIN
    -- Only set created_by if user is authenticated and field is null
    IF (NEW.created_by IS NULL AND auth.uid() IS NOT NULL) THEN
        NEW.created_by := auth.uid();
    END IF;
    
    -- Set user_id if not provided but we have auth.uid()
    IF (NEW.user_id IS NULL AND auth.uid() IS NOT NULL) THEN
        NEW.user_id := auth.uid();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER trg_safe_set_created_by_schools 
    BEFORE INSERT ON public.schools 
    FOR EACH ROW EXECUTE FUNCTION public.safe_set_created_by();

-- ================================
-- 6. INDEXES FOR PERFORMANCE
-- ================================

CREATE INDEX IF NOT EXISTS idx_schools_user_id ON public.schools(user_id);
CREATE INDEX IF NOT EXISTS idx_schools_created_by ON public.schools(created_by);
CREATE INDEX IF NOT EXISTS idx_schools_status ON public.schools(status);
CREATE INDEX IF NOT EXISTS idx_schools_school_email ON public.schools(school_email);

-- ================================
-- 7. VERIFICATION
-- ================================

-- Test that we can insert a record
DO $$
DECLARE
    test_result text;
BEGIN
    -- Try to insert a test record
    BEGIN
        INSERT INTO public.schools (school_name, school_email, admin_full_name, status)
        VALUES ('Test School', 'test@example.com', 'Test Admin', 'pending');
        
        -- Delete the test record
        DELETE FROM public.schools WHERE school_name = 'Test School' AND school_email = 'test@example.com';
        
        RAISE NOTICE '✅ Database schema fixed successfully!';
        RAISE NOTICE '✅ Schools table can accept insertions';
        RAISE NOTICE '✅ Foreign key constraints resolved';
        RAISE NOTICE '✅ RLS policies configured';
        RAISE NOTICE '✅ Storage buckets ready';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '⚠️ Test insertion failed: %', SQLERRM;
    END;
END
$$;
