
import React, { useState, useEffect } from 'react';
import { supabase } from './supabase.ts';
import { Profile, View, Volunteer, TrainingModule, Role, Department, Journey } from './types.ts';
import { INITIAL_MODULES, INITIAL_ROLES, INITIAL_DEPARTMENTS, INITIAL_JOURNEYS, INITIAL_VOLUNTEERS } from './constants.tsx';
import LandingPage from './components/LandingPage.tsx';
import AuthForm from './components/AuthForm.tsx';
import Sidebar from './components/Sidebar.tsx';
import Header from './components/Header.tsx';
import Dashboard from './components/Dashboard.tsx';
import VolunteerList from './components/VolunteerList.tsx';
import ModuleManager from './components/ModuleManager.tsx';
import JourneyBuilder from './components/JourneyBuilder.tsx';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [view, setView] = useState<View>('DASHBOARD');
  const [dbStatus, setDbStatus] = useState<'OK' | 'MISSING_TABLE' | 'ERROR'>('OK');

  // Directory and Training State
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [modules, setModules] = useState<TrainingModule[]>(INITIAL_MODULES);
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [journeys, setJourneys] = useState<Journey[]>(INITIAL_JOURNEYS);

  // Impersonation State
  const [impersonatedUser, setImpersonatedUser] = useState<Volunteer | null>(null);

  useEffect(() => {
    const storedVolunteers = localStorage.getItem('journey_volunteers');
    if (storedVolunteers) {
      setVolunteers(JSON.parse(storedVolunteers));
    } else {
      setVolunteers(INITIAL_VOLUNTEERS);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id, session);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id, session);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (volunteers.length > 0 && dbStatus === 'OK') {
      localStorage.setItem('journey_volunteers', JSON.stringify(volunteers));
    }
  }, [volunteers, dbStatus]);

  const fetchProfile = async (userId: string, currentSession: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.message.includes('profiles') && error.message.includes('not find')) {
          setDbStatus('MISSING_TABLE');
          handleFallbackProfile(userId, currentSession);
        } else if (error.code === 'PGRST116') {
          await createProfile(userId, currentSession);
        } else {
          handleFallbackProfile(userId, currentSession);
        }
      } else {
        setDbStatus('OK');
        setProfile(data);
        if (data.role === 'admin') {
          fetchVolunteers();
        } else {
          setVolunteers([mapProfileToVolunteer(data)]);
        }
      }
    } catch (err: any) {
      handleFallbackProfile(userId, currentSession);
    } finally {
      setLoading(false);
    }
  };

  const handleFallbackProfile = (userId: string, currentSession: any) => {
    const fallback: Profile = {
      id: userId,
      full_name: currentSession?.user?.user_metadata?.full_name || currentSession?.user?.email?.split('@')[0] || 'User',
      email: currentSession?.user?.email || '',
      role: 'volunteer',
      created_at: new Date().toISOString(),
      role_ids: [],
      completed_chapter_ids: []
    };
    setProfile(fallback);
  };

  const createProfile = async (userId: string, currentSession: any) => {
    const email = currentSession?.user?.email || '';
    const newProfile: Partial<Profile> = {
      id: userId,
      full_name: currentSession?.user?.user_metadata?.full_name || email.split('@')[0] || 'User',
      username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
      email: email,
      role: volunteers.length === 0 ? 'admin' : 'volunteer',
      role_ids: [],
      completed_chapter_ids: [],
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase.from('profiles').upsert(newProfile).select().single();
    if (!error && data) {
      setProfile(data);
      if (data.role === 'admin') fetchVolunteers();
    } else {
      setProfile(newProfile as Profile);
    }
  };

  const fetchVolunteers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });

    if (!error && data) {
      setDbStatus('OK');
      setVolunteers(data.map(mapProfileToVolunteer));
    }
  };

  const mapProfileToVolunteer = (p: any): Volunteer => ({
    id: p.id,
    fullName: p.full_name || 'Unnamed',
    username: p.username || p.email?.split('@')[0] || 'user',
    email: p.email,
    phone: p.phone || '',
    avatarUrl: p.avatar_url,
    roleIds: p.role_ids || [],
    completedChapterIds: p.completed_chapter_ids || [],
    joinedAt: p.created_at || new Date().toISOString(),
    isAdmin: p.role === 'admin'
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('DASHBOARD');
    setImpersonatedUser(null);
  };

  const handleUpdateVolunteer = async (updated: Volunteer) => {
    if (dbStatus === 'OK') {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updated.fullName,
          username: updated.username.toLowerCase().trim(),
          phone: updated.phone,
          avatar_url: updated.avatarUrl,
          role_ids: updated.roleIds,
          role: updated.isAdmin ? 'admin' : 'volunteer'
        })
        .eq('id', updated.id);

      if (error) {
        if (error.message.includes('unique constraint') || error.code === '23505') {
          throw new Error(`The username "${updated.username}" is already taken.`);
        }
        console.error('Error updating volunteer in DB:', error.message);
        throw error;
      }
    }
    setVolunteers(prev => prev.map(v => v.id === updated.id ? updated : v));
    if (profile?.id === updated.id) {
      setProfile(prev => prev ? ({ 
        ...prev, 
        full_name: updated.fullName, 
        username: updated.username, 
        phone: updated.phone,
        avatar_url: updated.avatarUrl
      }) : null);
    }
  };

  const handleResetProgress = async (volunteerId: string, moduleId?: string) => {
    let newCompletedIds: string[] = [];
    setVolunteers(prev => prev.map(v => {
      if (v.id !== volunteerId) return v;
      if (!moduleId) {
        newCompletedIds = [];
      } else {
        const module = modules.find(m => m.id === moduleId);
        if (!module) return v;
        const chapterIds = module.chapters.map(c => c.id);
        newCompletedIds = v.completedChapterIds.filter(id => !chapterIds.includes(id));
      }
      return { ...v, completedChapterIds: newCompletedIds };
    }));

    if (dbStatus === 'OK') {
      await supabase.from('profiles').update({ completed_chapter_ids: newCompletedIds }).eq('id', volunteerId);
    }
  };

  const handleUpdateJourney = (roleId: string, progressionIds: string[]) => {
    setJourneys(prev => {
      const existing = prev.find(j => j.roleId === roleId);
      if (existing) return prev.map(j => j.roleId === roleId ? { ...j, progressionModuleIds: progressionIds } : j);
      return [...prev, { id: 'j' + Date.now(), roleId, progressionModuleIds: progressionIds }];
    });
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!session) return showAuth ? <AuthForm onBack={() => setShowAuth(false)} /> : <LandingPage onGetStarted={() => setShowAuth(true)} onLogin={() => setShowAuth(true)} />;

  const activeProfile = impersonatedUser ? {
    id: impersonatedUser.id,
    full_name: impersonatedUser.fullName + (impersonatedUser.id === profile?.id ? "" : " (Previewing)"),
    email: impersonatedUser.email,
    role: 'volunteer' as const,
    created_at: impersonatedUser.joinedAt,
    completed_chapter_ids: impersonatedUser.completedChapterIds,
    role_ids: impersonatedUser.roleIds,
    avatar_url: impersonatedUser.avatarUrl
  } : profile;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900">
      <Sidebar 
        currentView={view} 
        setView={setView} 
        isAdmin={profile?.role === 'admin'} 
        isImpersonating={!!impersonatedUser}
        onStopImpersonating={() => setImpersonatedUser(null)}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          profile={activeProfile} 
          onProfileUpdate={(updated) => {
            setProfile(updated);
            setVolunteers(prev => prev.map(v => v.id === updated.id ? { 
              ...v, 
              fullName: updated.full_name,
              email: updated.email,
              phone: updated.phone || '',
              avatarUrl: updated.avatar_url
            } : v));
          }}
          onLogout={handleLogout}
        />
        
        {profile?.role === 'admin' && (
          <div className="bg-amber-50 border-b border-amber-100 p-4 animate-fadeIn">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-900">Fix "avatar_url" Column & Storage (V6)</p>
                  <p className="text-xs text-amber-700">Run this if you see "Could not find column" or "Bucket not found" errors.</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  const sql = `-- V6: Fix Schema Cache & Add Missing Columns
-- 1. Ensure Table and all Columns exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  username TEXT UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'volunteer',
  role_ids TEXT[] DEFAULT '{}',
  completed_chapter_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Explicitly add avatar_url if the table existed without it
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3. Create the 'avatars' storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage Security Policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' );
DROP POLICY IF EXISTS "Anyone can update their own avatar." ON storage.objects;
CREATE POLICY "Anyone can update their own avatar." ON storage.objects FOR UPDATE USING ( bucket_id = 'avatars' );

-- 5. Enable RLS and Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins can update all profiles." ON public.profiles;
CREATE POLICY "Admins can update all profiles." ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 6. New User Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_username TEXT;
BEGIN
  base_username := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9]', '', 'g'));
  INSERT INTO public.profiles (id, email, full_name, username, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', base_username, 'volunteer')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`;
                  navigator.clipboard.writeText(sql);
                  alert('V6 SQL Script Copied! Paste this into the Supabase SQL Editor and click RUN to fix the column error.');
                }}
                className="px-4 py-2 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-sm"
              >
                Copy V6 SQL Script
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {view === 'DASHBOARD' && (
            <Dashboard profile={activeProfile} volunteers={volunteers} modules={modules} roles={roles} departments={departments} journeys={journeys} />
          )}
          
          {view === 'VOLUNTEERS' && profile?.role === 'admin' && (
            <VolunteerList 
              volunteers={volunteers} setVolunteers={setVolunteers} modules={modules} roles={roles} departments={departments} journeys={journeys}
              onUpdateVolunteer={handleUpdateVolunteer} onResetProgress={handleResetProgress} onRefresh={() => fetchVolunteers()}
              onViewAs={(id) => { const target = volunteers.find(v => v.id === id); if (target) { setImpersonatedUser(target); setView('DASHBOARD'); } }}
            />
          )}

          {view === 'MODULES' && profile?.role === 'admin' && (
            <ModuleManager 
              modules={modules} roles={roles} departments={departments}
              onCreateModule={(m) => setModules(prev => [...prev, m])}
              onUpdateModule={(m) => setModules(prev => prev.map(curr => curr.id === m.id ? m : curr))}
            />
          )}

          {view === 'JOURNEY_BUILDER' && profile?.role === 'admin' && (
            <JourneyBuilder 
              modules={modules} departments={departments} roles={roles} journeys={journeys} onUpdateJourney={handleUpdateJourney}
              onUpdateDepartmentCore={(deptId, coreIds) => setDepartments(prev => prev.map(d => d.id === deptId ? { ...d, coreModuleIds: coreIds } : d))}
              onUpdateDepartments={setDepartments} onUpdateRoles={setRoles}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
