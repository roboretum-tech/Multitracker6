-- =========================================================================
-- CAPRICORN STRATEGIC EXECUTION ASSESSMENT (CSEA v4.0)
-- COMPLETE SUPABASE / POSTGRESQL SCHEMA SPECIFICATION
-- Includes: RACI, Tasks, Dependencies (CPM), Baseline, Meetings, Invoices
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TEAM MEMBERS (Profiles & RACI Matrix)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.team_members (
    id TEXT PRIMARY KEY DEFAULT ('tm-' || uuid_generate_v4()::text),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    role TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. PROJECTS (Strategic Initiatives)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY DEFAULT ('proj-' || uuid_generate_v4()::text),
    name TEXT NOT NULL,
    category TEXT,
    status TEXT DEFAULT 'No iniciado',
    priority TEXT DEFAULT 'Medio',
    custom_tags TEXT[],
    start_date DATE,
    deadline DATE,
    completion_date DATE,
    progress_percentage NUMERIC DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    estimated_value NUMERIC DEFAULT 0,
    key_document_links TEXT,
    
    -- Baseline Tracking
    baseline_captured_at TIMESTAMP WITH TIME ZONE,
    baseline_start_date DATE,
    baseline_deadline DATE,
    
    -- RACI Roles
    responsible_id TEXT REFERENCES public.team_members(id) ON DELETE SET NULL,
    accountable_id TEXT REFERENCES public.team_members(id) ON DELETE SET NULL,
    consulted_id TEXT REFERENCES public.team_members(id) ON DELETE SET NULL,
    informed_id TEXT REFERENCES public.team_members(id) ON DELETE SET NULL,
    
    -- Cached Rollups (Managed for Performance)
    task_count INTEGER DEFAULT 0,
    overdue_task_count INTEGER DEFAULT 0,
    meeting_count INTEGER DEFAULT 0,
    comm_count INTEGER DEFAULT 0,
    total_invoiced NUMERIC DEFAULT 0,
    next_meeting_date TIMESTAMP WITH TIME ZONE,
    last_meeting_date TIMESTAMP WITH TIME ZONE,
    last_comm_date TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. TASKS (Entregables, CPM & Baseline)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY DEFAULT ('task-' || uuid_generate_v4()::text),
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    is_done BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'No iniciada',
    priority TEXT DEFAULT 'Medio',
    owner_id TEXT REFERENCES public.team_members(id) ON DELETE SET NULL,
    notes TEXT,
    
    -- Critical Path Method (CPM) Dependencies
    dependencies TEXT[] DEFAULT '{}',
    
    -- Baseline Comparison Fields
    baseline_start_date DATE,
    baseline_end_date DATE,
    baseline_duration_days INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. MEETINGS (Comités, Sesiones & Minutas)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.meetings (
    id TEXT PRIMARY KEY DEFAULT ('meet-' || uuid_generate_v4()::text),
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
    meeting_type TEXT DEFAULT 'Reunión de alineación',
    status TEXT DEFAULT 'Reunión programada',
    attendees TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5. COMMUNICATIONS (Bitácora de Acuerdos)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.communications (
    id TEXT PRIMARY KEY DEFAULT ('comm-' || uuid_generate_v4()::text),
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    comm_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    comm_type TEXT DEFAULT 'Correo electrónico',
    outcome TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 6. INVOICES (Honorarios y Facturación)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.invoices (
    id TEXT PRIMARY KEY DEFAULT ('inv-' || uuid_generate_v4()::text),
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    amount NUMERIC DEFAULT 0,
    sent_date DATE,
    due_date DATE,
    status TEXT DEFAULT 'Aún no enviado',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Allow access to both anon and authenticated client roles
DROP POLICY IF EXISTS "Allow anon and auth on team_members" ON public.team_members;
CREATE POLICY "Allow anon and auth on team_members" ON public.team_members FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon and auth on projects" ON public.projects;
CREATE POLICY "Allow anon and auth on projects" ON public.projects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon and auth on tasks" ON public.tasks;
CREATE POLICY "Allow anon and auth on tasks" ON public.tasks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon and auth on meetings" ON public.meetings;
CREATE POLICY "Allow anon and auth on meetings" ON public.meetings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon and auth on communications" ON public.communications;
CREATE POLICY "Allow anon and auth on communications" ON public.communications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon and auth on invoices" ON public.invoices;
CREATE POLICY "Allow anon and auth on invoices" ON public.invoices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- 8. INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_meetings_project_id ON public.meetings(project_id);
CREATE INDEX IF NOT EXISTS idx_comms_project_id ON public.communications(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON public.invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_owner_id ON public.tasks(owner_id);
