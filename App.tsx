
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
  const [dbStatus, setDbStatus] = useState<'OK' | 'MISSING_TABLES' | 'ERROR'>('OK');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

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
      if (session) initializeApp(session);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) initializeApp(session);
      else {
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
        else if (error.code === '42P01') setDbStatus('MISSING_TABLES');
        else setDbStatus('ERROR');
      } else {
        setProfile(data);
      }
    } catch (err) {
      setDbStatus('ERROR');
    }
  };

  const createProfile = async (userId: string, currentSession: any) => {
    const email = currentSession?.user?.email || '';
    const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const isFirstUser = count === 0;

    const newProfile = {
      id: userId,
      full_name: currentSession?.user?.user_metadata?.full_name || email.split('@')[0],
      username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000),
      email: email,
      role: isFirstUser ? 'admin' : 'volunteer',
      role_ids: [],
      completed_chapter_ids: [],
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase.from('profiles').upsert(newProfile).select().single();
    if (error) console.error("Profile creation error:", error);
    if (data) setProfile(data);
  };

  const fetchAllData = async () => {
    try {
      const [
        { data: depts, error: e1 },
        { data: rls, error: e2 },
        { data: mods, error: e3 },
        { data: jrns, error: e4 },
        { data: profs, error: e5 }
      ] = await Promise.all([
        supabase.from('departments').select('*').order('name'),
        supabase.from('roles').select('*').order('name'),
        supabase.from('modules').select('*').order('title'),
        supabase.from('journeys').select('*'),
        supabase.from('profiles').select('*').order('full_name')
      ]);

      if (e1?.code === '42P01' || e2?.code === '42P01') {
        setDbStatus('MISSING_TABLES');
        return;
      }

      if (depts) setDepartments(depts);
      if (rls) setRoles(rls);
      if (mods) setModules(mods);
      if (jrns) setJourneys(jrns);
      if (profs) setVolunteers(profs.map(mapProfileToVolunteer));
      setDbStatus('OK');
    } catch (err) {
      setDbStatus('ERROR');
    }
  };

  const seedDatabase = async () => {
    setIsSeeding(true);
    try {
      await Promise.all([
        supabase.from('departments').insert(INITIAL_DEPARTMENTS.map(d => ({ id: d.id, name: d.name, coreModuleIds: d.coreModuleIds }))),
        supabase.from('roles').insert(INITIAL_ROLES.map(r => ({ id: r.id, name: r.name, departmentId: r.departmentId }))),
        supabase.from('modules').insert(INITIAL_MODULES),
        supabase.from('journeys').insert(INITIAL_JOURNEYS)
      ]);
    } catch (err) {
      console.error("Seed failed:", err);
    } finally {
      setIsSeeding(false);
    }
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setImpersonatedUser(null);
    setView('DASHBOARD');
  };

  const handleUpdateVolunteer = async (v: Volunteer) => {
    const { error } = await supabase.from('profiles').update({ username: v.username, role_ids: v.roleIds, role: v.isAdmin ? 'admin' : 'volunteer' }).eq('id', v.id);
    if (error) throw error;
    await fetchAllData();
  };

  const handleResetProgress = async (volunteerId: string, moduleId?: string) => {
    const target = volunteers.find(v => v.id === volunteerId);
    if (!target) return;
    let newIds: string[] = [];
    if (moduleId) {
      const mod = modules.find(m => m.id === moduleId);
      const modChapters = mod?.chapters.map(c => c.id) || [];
      newIds = target.completedChapterIds.filter(id => !modChapters.includes(id));
    }
    await supabase.from('profiles').update({ completed_chapter_ids: newIds }).eq('id', volunteerId);
    await fetchAllData();
  };

  const handleUpdateJourney = async (roleId: string, progressionIds: string[]) => {
    const existing = journeys.find(j => j.roleId === roleId);
    const id = existing?.id || `j-${roleId}`;
    await supabase.from('journeys').upsert({ id, roleId, progressionModuleIds: progressionIds });
    await fetchAllData();
  };

  const handleUpdateDeptCore = async (deptId: string, coreIds: string[]) => {
    await supabase.from('departments').update({ coreModuleIds: coreIds }).eq('id', deptId);
    await fetchAllData();
  };

  const getSqlScript = () => {
    return `-- SQL V7 Schema Logic Provided Previously`;
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!session) return showAuth ? <AuthForm onBack={() => setShowAuth(false)} /> : <LandingPage onGetStarted={() => setShowAuth(true)} onLogin={() => setShowAuth(true)} />;

  if (dbStatus === 'MISSING_TABLES') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-lg w-full bg-white rounded-[3rem] shadow-2xl p-12 text-center border border-gray-100">
          <h2 className="text-3xl font-black text-gray-900 mb-4">Database Not Configured</h2>
          <button onClick={() => { navigator.clipboard.writeText(getSqlScript()); alert('SQL Script Copied!'); }} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px]">Copy Migration SQL</button>
        </div>
      </div>
    );
  }

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
      <Sidebar currentView={view} setView={(v) => { setView(v); setIsSidebarOpen(false); }} isAdmin={profile?.role === 'admin'} isImpersonating={!!impersonatedUser} onStopImpersonating={() => setImpersonatedUser(null)} onLogout={handleLogout} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header profile={activeProfile} onProfileUpdate={() => initializeApp(session)} onLogout={handleLogout} onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        {profile?.role === 'admin' && (
          <div className="bg-blue-600 border-b border-blue-700 p-2 sm:p-4 animate-fadeIn">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-white">Supabase Admin Control</p>
              <div className="flex items-center space-x-2">
                <button disabled={isSeeding} onClick={async () => { await seedDatabase(); await fetchAllData(); alert('Data bootstrapped!'); }} className="px-3 py-1.5 bg-white text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-lg disabled:opacity-50">
                  {isSeeding ? 'Seeding...' : 'Bootstrap Data'}
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          {view === 'DASHBOARD' && <Dashboard profile={activeProfile} volunteers={volunteers} modules={modules} roles={roles} departments={departments} journeys={journeys} />}
          {view === 'VOLUNTEERS' && <VolunteerList volunteers={volunteers} setVolunteers={setVolunteers} modules={modules} roles={roles} departments={departments} journeys={journeys} onUpdateVolunteer={handleUpdateVolunteer} onResetProgress={handleResetProgress} onViewAs={(id) => { const target = volunteers.find(v => v.id === id); if (target) { setImpersonatedUser(target); setView('DASHBOARD'); } }} onRefresh={fetchAllData} />}
          {view === 'MODULES' && <ModuleManager modules={modules} roles={roles} departments={departments} onCreateModule={async (m) => { await supabase.from('modules').insert(m); fetchAllData(); }} onUpdateModule={async (m) => { await supabase.from('modules').update(m).eq('id', m.id); fetchAllData(); }} />}
          {view === 'JOURNEY_BUILDER' && (
            <JourneyBuilder 
              modules={modules} 
              departments={departments} 
              roles={roles} 
              journeys={journeys} 
              onUpdateJourney={handleUpdateJourney} 
              onUpdateDepartmentCore={handleUpdateDeptCore} 
              onUpdateDepartments={async (depts) => { await supabase.from('departments').upsert(depts); await fetchAllData(); }} 
              onUpdateRoles={async (rls) => { await supabase.from('roles').upsert(rls); await fetchAllData(); }} 
              onDeleteDepartment={async (id) => { await supabase.from('departments').delete().eq('id', id); await fetchAllData(); }}
              onDeleteRole={async (id) => { await supabase.from('roles').delete().eq('id', id); await fetchAllData(); }}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
