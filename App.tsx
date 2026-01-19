
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
    // Initial load from Local Storage (Fallback)
    const storedVolunteers = localStorage.getItem('journey_volunteers');
    if (storedVolunteers) {
      setVolunteers(JSON.parse(storedVolunteers));
    } else {
      setVolunteers(INITIAL_VOLUNTEERS);
    }

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id, session);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
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

  // Save to local storage whenever volunteers change (for resilience)
  useEffect(() => {
    if (volunteers.length > 0) {
      localStorage.setItem('journey_volunteers', JSON.stringify(volunteers));
    }
  }, [volunteers]);

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
          // Profile row missing - try to create it
          await createProfile(userId, currentSession);
        } else {
          console.error('Profile fetch error:', error.message);
          handleFallbackProfile(userId, currentSession);
        }
      } else {
        setDbStatus('OK');
        setProfile(data);
        if (data.role === 'admin') fetchVolunteers();
        else setVolunteers([mapProfileToVolunteer(data)]);
      }
    } catch (err: any) {
      console.error('Exception fetching profile details:', err.message || err);
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
      role: 'admin',
      created_at: new Date().toISOString(),
      role_ids: [],
      completed_chapter_ids: []
    };
    setProfile(fallback);
  };

  const createProfile = async (userId: string, currentSession: any) => {
    const newProfile: Partial<Profile> = {
      id: userId,
      full_name: currentSession?.user?.user_metadata?.full_name || currentSession?.user?.email?.split('@')[0] || 'User',
      email: currentSession?.user?.email || '',
      role: 'admin',
      role_ids: [],
      completed_chapter_ids: [],
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase.from('profiles').upsert(newProfile).select().single();
    if (!error) {
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

    if (error) {
      if (error.message.includes('profiles') && error.message.includes('not find')) {
        setDbStatus('MISSING_TABLE');
      } else {
        console.error('Error fetching volunteers:', error.message);
      }
    } else if (data) {
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
    setVolunteers(prev => prev.map(v => v.id === updated.id ? updated : v));

    if (dbStatus === 'OK') {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updated.fullName,
          username: updated.username,
          phone: updated.phone,
          role_ids: updated.roleIds,
          role: updated.isAdmin ? 'admin' : 'volunteer'
        })
        .eq('id', updated.id);

      if (error) console.error('Error updating volunteer in DB:', error.message);
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
      const { error } = await supabase
        .from('profiles')
        .update({ completed_chapter_ids: newCompletedIds })
        .eq('id', volunteerId);

      if (error) console.error('Error resetting progress in DB:', error.message);
    }
  };

  const handleUpdateJourney = (roleId: string, progressionIds: string[]) => {
    setJourneys(prev => {
      const existing = prev.find(j => j.roleId === roleId);
      if (existing) {
        return prev.map(j => j.roleId === roleId ? { ...j, progressionModuleIds: progressionIds } : j);
      }
      return [...prev, { id: 'j' + Date.now(), roleId, progressionModuleIds: progressionIds }];
    });
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return showAuth ? (
      <AuthForm onBack={() => setShowAuth(false)} />
    ) : (
      <LandingPage onGetStarted={() => setShowAuth(true)} onLogin={() => setShowAuth(true)} />
    );
  }

  const activeProfile = impersonatedUser ? {
    id: impersonatedUser.id,
    full_name: impersonatedUser.fullName + (impersonatedUser.id === profile?.id ? "" : " (Previewing)"),
    email: impersonatedUser.email,
    role: 'volunteer' as const,
    created_at: impersonatedUser.joinedAt,
    completed_chapter_ids: impersonatedUser.completedChapterIds,
    role_ids: impersonatedUser.roleIds
  } : profile;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar 
        currentView={view} 
        setView={setView} 
        isAdmin={profile?.role === 'admin'} 
        isImpersonating={!!impersonatedUser}
        onStopImpersonating={() => setImpersonatedUser(null)}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden text-gray-900">
        <Header profile={activeProfile} />
        
        {dbStatus === 'MISSING_TABLE' && profile?.role === 'admin' && (
          <div className="bg-amber-50 border-b border-amber-100 p-4 animate-fadeIn">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-900">Database Setup Required</p>
                  <p className="text-xs text-amber-700">The 'profiles' table is missing. Run the SQL script in your Supabase dashboard to enable live sync.</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  const sql = `CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  username TEXT,
  phone TEXT,
  role TEXT DEFAULT 'volunteer',
  role_ids TEXT[] DEFAULT '{}',
  completed_chapter_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);`;
                  navigator.clipboard.writeText(sql);
                  alert('SQL Copied to clipboard! Paste it into your Supabase SQL Editor.');
                }}
                className="px-4 py-2 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-sm"
              >
                Copy SQL Setup
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {view === 'DASHBOARD' && (
            <Dashboard 
              profile={activeProfile}
              volunteers={volunteers}
              modules={modules}
              roles={roles}
              departments={departments}
              journeys={journeys}
            />
          )}
          
          {view === 'VOLUNTEERS' && profile?.role === 'admin' && (
            <VolunteerList 
              volunteers={volunteers}
              setVolunteers={setVolunteers}
              modules={modules}
              roles={roles}
              departments={departments}
              journeys={journeys}
              onUpdateVolunteer={handleUpdateVolunteer}
              onResetProgress={handleResetProgress}
              onViewAs={(id) => {
                const target = volunteers.find(v => v.id === id);
                if (target) {
                  setImpersonatedUser(target);
                  setView('DASHBOARD');
                }
              }}
            />
          )}

          {view === 'MODULES' && profile?.role === 'admin' && (
            <ModuleManager 
              modules={modules}
              roles={roles}
              departments={departments}
              onCreateModule={(m) => setModules(prev => [...prev, m])}
              onUpdateModule={(m) => setModules(prev => prev.map(curr => curr.id === m.id ? m : curr))}
            />
          )}

          {view === 'JOURNEY_BUILDER' && profile?.role === 'admin' && (
            <JourneyBuilder 
              modules={modules}
              departments={departments}
              roles={roles}
              journeys={journeys}
              onUpdateJourney={handleUpdateJourney}
              onUpdateDepartmentCore={(deptId, coreIds) => 
                setDepartments(prev => prev.map(d => d.id === deptId ? { ...d, coreModuleIds: coreIds } : d))
              }
              onUpdateDepartments={setDepartments}
              onUpdateRoles={setRoles}
            />
          )}

          {view === 'LIBRARY' && (
            <div className="p-10 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm animate-fadeIn">
               <h2 className="text-3xl font-black mb-4 tracking-tight">Course Library</h2>
               <p className="text-gray-500 font-medium">Explore and search the complete collection of training modules.</p>
               <div className="mt-12 p-20 border-2 border-dashed border-gray-100 rounded-[2rem] text-center">
                  <p className="text-gray-300 font-bold uppercase tracking-widest text-xs">Library Content Search Coming Soon</p>
               </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
