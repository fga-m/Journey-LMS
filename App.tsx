
import React, { useState, useEffect } from 'react';
import { supabase } from './supabase.ts';
import { Profile, View, Course, Enrollment, Volunteer, TrainingModule, Role, Department, Journey } from './types.ts';
import { INITIAL_VOLUNTEERS, INITIAL_MODULES, INITIAL_ROLES, INITIAL_DEPARTMENTS, INITIAL_JOURNEYS } from './constants.tsx';
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

  // Admin Data State (Fallback to constants for demo/initial setup)
  const [volunteers, setVolunteers] = useState<Volunteer[]>(INITIAL_VOLUNTEERS);
  const [modules, setModules] = useState<TrainingModule[]>(INITIAL_MODULES);
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [journeys, setJourneys] = useState<Journey[]>(INITIAL_JOURNEYS);

  // Impersonation State
  const [impersonatedUser, setImpersonatedUser] = useState<Volunteer | null>(null);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        // Fallback for demo if profiles table not yet populated via trigger
        setProfile({
          id: userId,
          full_name: session?.user?.email?.split('@')[0] || 'User',
          email: session?.user?.email || '',
          role: 'admin', // Default to admin for first user/setup convenience
          created_at: new Date().toISOString()
        });
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('DASHBOARD');
    setImpersonatedUser(null);
  };

  const handleUpdateVolunteer = (updated: Volunteer) => {
    setVolunteers(prev => prev.map(v => v.id === updated.id ? updated : v));
  };

  const handleResetProgress = (volunteerId: string, moduleId?: string) => {
    setVolunteers(prev => prev.map(v => {
      if (v.id !== volunteerId) return v;
      if (!moduleId) return { ...v, completedChapterIds: [] };
      const module = modules.find(m => m.id === moduleId);
      if (!module) return v;
      const chapterIds = module.chapters.map(c => c.id);
      return { ...v, completedChapterIds: v.completedChapterIds.filter(id => !chapterIds.includes(id)) };
    }));
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
      <AuthForm 
        onBack={() => setShowAuth(false)} 
      />
    ) : (
      <LandingPage 
        onGetStarted={() => setShowAuth(true)} 
        onLogin={() => setShowAuth(true)} 
      />
    );
  }

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
        <Header profile={impersonatedUser ? {
          id: impersonatedUser.id,
          full_name: impersonatedUser.fullName + " (Previewing)",
          email: impersonatedUser.email,
          role: 'volunteer',
          created_at: impersonatedUser.joinedAt
        } : profile} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {view === 'DASHBOARD' && (
            <Dashboard 
              profile={impersonatedUser ? {
                id: impersonatedUser.id,
                full_name: impersonatedUser.fullName,
                email: impersonatedUser.email,
                role: 'volunteer',
                created_at: impersonatedUser.joinedAt
              } : profile} 
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
