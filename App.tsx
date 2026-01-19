
import React, { useState, useEffect } from 'react';
import { supabase } from './supabase.ts';
import { Profile, View, Volunteer, TrainingModule, Role, Department, Journey } from './types.ts';
import { INITIAL_MODULES, INITIAL_ROLES, INITIAL_DEPARTMENTS, INITIAL_JOURNEYS } from './constants.tsx';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Database State
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);

  const [impersonatedUser, setImpersonatedUser] = useState<Volunteer | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        initializeApp(session);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        initializeApp(session);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const initializeApp = async (currentSession: any) => {
    setLoading(true);
    await fetchProfile(currentSession.user.id, currentSession);
    await fetchAllData();
    setLoading(false);
  };

  const fetchProfile = async (userId: string, currentSession: any) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) {
        if (error.code === 'PGRST116') await createProfile(userId, currentSession);
        else setDbStatus('MISSING_TABLE');
      } else {
        setProfile(data);
      }
    } catch (err) {
      setDbStatus('ERROR');
    }
  };

  const createProfile = async (userId: string, currentSession: any) => {
    const email = currentSession?.user?.email || '';
    const newProfile = {
      id: userId,
      full_name: currentSession?.user?.user_metadata?.full_name || email.split('@')[0],
      username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
      email: email,
      role: 'volunteer',
      role_ids: [],
      completed_chapter_ids: [],
      created_at: new Date().toISOString()
    };
    const { data } = await supabase.from('profiles').upsert(newProfile).select().single();
    if (data) setProfile(data);
  };

  const fetchAllData = async () => {
    try {
      const [
        { data: depts },
        { data: rls },
        { data: mods },
        { data: jrns },
        { data: profs }
      ] = await Promise.all([
        supabase.from('departments').select('*'),
        supabase.from('roles').select('*'),
        supabase.from('modules').select('*'),
        supabase.from('journeys').select('*'),
        supabase.from('profiles').select('*').order('full_name')
      ]);

      if (depts && depts.length === 0 && profile?.role === 'admin') {
        await seedDatabase();
        return fetchAllData();
      }

      if (depts) setDepartments(depts);
      if (rls) setRoles(rls);
      if (mods) setModules(mods);
      if (jrns) setJourneys(jrns);
      if (profs) setVolunteers(profs.map(mapProfileToVolunteer));
      setDbStatus('OK');
    } catch (err) {
      console.error("Data fetch error:", err);
      setDbStatus('ERROR');
    }
  };

  const seedDatabase = async () => {
    await supabase.from('departments').insert(INITIAL_DEPARTMENTS);
    await supabase.from('roles').insert(INITIAL_ROLES);
    await supabase.from('modules').insert(INITIAL_MODULES);
    await supabase.from('journeys').insert(INITIAL_JOURNEYS);
  };

  const mapProfileToVolunteer = (p: any): Volunteer => ({
    id: p.id,
    fullName: p.full_name || 'Unnamed',
    username: p.username || 'user',
    email: p.email,
    phone: p.phone || '',
    avatarUrl: p.avatar_url,
    roleIds: p.role_ids || [],
    completedChapterIds: p.completed_chapter_ids || [],
    joinedAt: p.created_at || new Date().toISOString(),
    isAdmin: p.role === 'admin'
  });

  const handleUpdateVolunteer = async (updated: Volunteer) => {
    const { error } = await supabase.from('profiles').update({
      full_name: updated.fullName,
      username: updated.username,
      phone: updated.phone,
      avatar_url: updated.avatarUrl,
      role_ids: updated.roleIds,
      role: updated.isAdmin ? 'admin' : 'volunteer'
    }).eq('id', updated.id);
    if (error) throw error;
    await fetchAllData();
  };

  const handleResetProgress = async (volunteerId: string, moduleId?: string) => {
    let newCompletedIds: string[] = [];
    const v = volunteers.find(vol => vol.id === volunteerId);
    if (!v) return;

    if (!moduleId) {
      newCompletedIds = [];
    } else {
      const module = modules.find(m => m.id === moduleId);
      if (!module) return;
      const chapterIds = module.chapters.map(c => c.id);
      newCompletedIds = v.completedChapterIds.filter(id => !chapterIds.includes(id));
    }

    await supabase.from('profiles').update({ completed_chapter_ids: newCompletedIds }).eq('id', volunteerId);
    await fetchAllData();
  };

  const handleUpdateJourney = async (roleId: string, progressionIds: string[]) => {
    const existing = journeys.find(j => j.roleId === roleId);
    if (existing) {
      await supabase.from('journeys').update({ progressionModuleIds: progressionIds }).eq('roleId', roleId);
    } else {
      await supabase.from('journeys').insert({ id: 'j' + Date.now(), roleId, progressionModuleIds: progressionIds });
    }
    await fetchAllData();
  };

  const handleUpdateDeptCore = async (deptId: string, coreIds: string[]) => {
    await supabase.from('departments').update({ coreModuleIds: coreIds }).eq('id', deptId);
    await fetchAllData();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('DASHBOARD');
    setImpersonatedUser(null);
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!session) return showAuth ? <AuthForm onBack={() => setShowAuth(false)} /> : <LandingPage onGetStarted={() => setShowAuth(true)} onLogin={() => setShowAuth(true)} />;

  const activeProfile = impersonatedUser ? {
    id: impersonatedUser.id,
    full_name: impersonatedUser.fullName + " (Previewing)",
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
        setView={(v) => { setView(v); setIsSidebarOpen(false); }} 
        isAdmin={profile?.role === 'admin'} 
        isImpersonating={!!impersonatedUser} 
        onStopImpersonating={() => setImpersonatedUser(null)} 
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          profile={activeProfile} 
          onProfileUpdate={initializeApp} 
          onLogout={handleLogout} 
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        
        {profile?.role === 'admin' && (
          <div className="bg-blue-600 border-b border-blue-700 p-2 sm:p-4 animate-fadeIn">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-3 text-white">
                <p className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Database Centralization (V7)</p>
              </div>
              <button onClick={() => {
                const sql = `-- V7: Complete LMS Schema... (Original SQL content here)`;
                navigator.clipboard.writeText(sql);
                alert('SQL Script Copied!');
              }} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white text-blue-600 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-lg">Copy V7 SQL</button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          {view === 'DASHBOARD' && <Dashboard profile={activeProfile} volunteers={volunteers} modules={modules} roles={roles} departments={departments} journeys={journeys} />}
          {view === 'VOLUNTEERS' && <VolunteerList volunteers={volunteers} setVolunteers={setVolunteers} modules={modules} roles={roles} departments={departments} journeys={journeys} onUpdateVolunteer={handleUpdateVolunteer} onResetProgress={handleResetProgress} onViewAs={(id) => { const target = volunteers.find(v => v.id === id); if (target) { setImpersonatedUser(target); setView('DASHBOARD'); } }} onRefresh={fetchAllData} />}
          {view === 'MODULES' && <ModuleManager modules={modules} roles={roles} departments={departments} onCreateModule={async (m) => { await supabase.from('modules').insert(m); fetchAllData(); }} onUpdateModule={async (m) => { await supabase.from('modules').update(m).eq('id', m.id); fetchAllData(); }} />}
          {view === 'JOURNEY_BUILDER' && <JourneyBuilder modules={modules} departments={departments} roles={roles} journeys={journeys} onUpdateJourney={handleUpdateJourney} onUpdateDepartmentCore={handleUpdateDeptCore} onUpdateDepartments={async (d) => { await supabase.from('departments').upsert(d); fetchAllData(); }} onUpdateRoles={async (r) => { await supabase.from('roles').upsert(r); fetchAllData(); }} />}
        </main>
      </div>
    </div>
  );
};

export default App;
