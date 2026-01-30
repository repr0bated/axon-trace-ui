-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'operator', 'user');
CREATE TYPE public.bus_type AS ENUM ('system', 'session');
CREATE TYPE public.alert_status AS ENUM ('open', 'acknowledged', 'resolved');
CREATE TYPE public.alert_severity AS ENUM ('critical', 'warning', 'info');

-- User roles table (RBAC)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- WireGuard keypairs (user identity)
CREATE TABLE public.user_keypairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    private_key_encrypted TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_keypairs ENABLE ROW LEVEL SECURITY;

-- Security definer functions for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Nodes table
CREATE TABLE public.nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hostname TEXT NOT NULL,
    ip_address INET,
    status TEXT DEFAULT 'online',
    last_seen TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;

-- Services table
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID REFERENCES public.nodes(id) ON DELETE CASCADE,
    bus bus_type NOT NULL DEFAULT 'system',
    name TEXT NOT NULL,
    unique_name TEXT,
    pid INTEGER,
    cmdline TEXT,
    is_activatable BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_services_node ON public.services(node_id);
CREATE INDEX idx_services_name ON public.services(name);

-- D-Bus objects table (optimized for 16k+ objects)
CREATE TABLE public.dbus_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    interfaces TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dbus_objects ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_objects_service ON public.dbus_objects(service_id);
CREATE INDEX idx_objects_path_trgm ON public.dbus_objects USING gin(path gin_trgm_ops);

-- Traces table
CREATE TABLE public.traces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID REFERENCES public.nodes(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    bus bus_type NOT NULL,
    message_type TEXT NOT NULL,
    sender TEXT,
    destination TEXT,
    path TEXT,
    interface TEXT,
    member TEXT,
    signature TEXT,
    payload JSONB,
    serial INTEGER,
    reply_serial INTEGER
);
ALTER TABLE public.traces ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_traces_node_time ON public.traces(node_id, timestamp DESC);
CREATE INDEX idx_traces_path ON public.traces(path);
CREATE INDEX idx_traces_interface ON public.traces(interface);

-- Logs table
CREATE TABLE public.logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID REFERENCES public.nodes(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    level TEXT NOT NULL,
    source TEXT,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'
);
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_logs_node_time ON public.logs(node_id, timestamp DESC);

-- Alerts table
CREATE TABLE public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID REFERENCES public.nodes(id) ON DELETE SET NULL,
    severity alert_severity NOT NULL DEFAULT 'info',
    status alert_status NOT NULL DEFAULT 'open',
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_alerts_status ON public.alerts(status);

-- Saved queries table
CREATE TABLE public.saved_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    query_filter JSONB NOT NULL,
    is_shared BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.saved_queries ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- user_roles: users can read their own role, admins can manage all
CREATE POLICY "Users can view own role" ON public.user_roles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles" ON public.user_roles
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- user_keypairs: users can only view their own keypair
CREATE POLICY "Users can view own keypair" ON public.user_keypairs
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- nodes: all authenticated users can view
CREATE POLICY "Authenticated users can view nodes" ON public.nodes
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Operators and admins can manage nodes" ON public.nodes
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

-- services: all authenticated can view
CREATE POLICY "Authenticated users can view services" ON public.services
    FOR SELECT TO authenticated
    USING (true);

-- dbus_objects: all authenticated can view
CREATE POLICY "Authenticated users can view objects" ON public.dbus_objects
    FOR SELECT TO authenticated
    USING (true);

-- traces: all authenticated can view
CREATE POLICY "Authenticated users can view traces" ON public.traces
    FOR SELECT TO authenticated
    USING (true);

-- logs: all authenticated can view
CREATE POLICY "Authenticated users can view logs" ON public.logs
    FOR SELECT TO authenticated
    USING (true);

-- alerts: all authenticated can view, operators/admins can manage
CREATE POLICY "Authenticated users can view alerts" ON public.alerts
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Operators and admins can manage alerts" ON public.alerts
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

-- saved_queries: users can manage own, view shared
CREATE POLICY "Users can manage own queries" ON public.saved_queries
    FOR ALL TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can view shared queries" ON public.saved_queries
    FOR SELECT TO authenticated
    USING (is_shared = true);

-- Function to create user role and keypair on signup (called by edge function)
CREATE OR REPLACE FUNCTION public.setup_new_user(
    _user_id UUID,
    _public_key TEXT,
    _private_key_encrypted TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    INSERT INTO public.user_keypairs (user_id, public_key, private_key_encrypted)
    VALUES (_user_id, _public_key, _private_key_encrypted)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$;