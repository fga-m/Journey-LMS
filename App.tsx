
import React, { useState, useMemo } from 'react';
import { View, Volunteer, TrainingModule, Role, Department, Notification, Journey } from './types.ts';
import { INITIAL_MODULES, INITIAL_VOLUNTEERS, INITIAL_JOURNEYS, INITIAL_DEPARTMENTS, INITIAL_ROLES } from './constants.tsx';
import Sidebar from './components/Sidebar.tsx';
import Header from './components/Header.tsx';
import Dashboard from './components/Dashboard.tsx';
import VolunteerList from './components/VolunteerList.tsx';
import ModuleManager from './components/ModuleManager.tsx';
import JourneyBuilder from './components/JourneyBuilder.tsx';
import LandingPage from './components/LandingPage.tsx';
import AuthForm from './components/AuthForm.tsx';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [view, setView] = useState<View>('DASHBOARD');
  
  const [volunteers, setVolunteers] = useState<Volunteer[]>(INITIAL_VOLUNTEERS);
  const [modules, setModules] = useState<TrainingModule[]>(INITIAL_MODULES);
  const [journeys, setJourneys] = useState<Journey[]>(INITIAL_JOURNEYS);
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [impersonatedVolunteerId, setImpersonatedVolunteerId] = useState<string | null>(null);
  const [previewModuleId, setPreviewModuleId] = useState<string | null>(null);

  const loggedInUser = useMemo(() => volunteers.find(v => v.id === currentUserId) || null, [volunteers, currentUserId]);
  const activePersona = useMemo(() => (impersonatedVolunteerId || currentUserId) === currentUserId ? loggedInUser : volunteers.find(v => v.id === impersonatedVolunteerId), [impersonatedVolunteerId, currentUserId, volunteers, loggedInUser]);

  const handleLogin = (username: string) => {
    const user = volunteers.find(v => v.username.toLowerCase() === username.toLowerCase());
    if (user) {
      setCurrentUserId(user.id);
      setIsAuthenticated(true);
      setShowAuth(false);
      return true;
    }
    return false;
  };

  const handleRegister = (name: string, username: string, email: string) => {
    const newUser: Volunteer = {
      id: 'v' + Date.now(),
      fullName: name,
      username: username,
      email: email,
      phone: '',
      roleIds: [],
      completedChapterIds: [],
      joinedAt: new Date().toISOString(),
      isAdmin: false
    };
    setVolunteers(prev => [...prev, newUser]);
    setCurrentUserId(newUser.id);
    setIsAuthenticated(true);
    setShowAuth(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUserId(null);
    setImpersonatedVolunteerId(null);
    setView('DASHBOARD');
  };

  const addNotification = (userId: string, message: string, type: Notification['type']) => {
    setNotifications(prev => [{ id: Math.random().toString(36).substr(2, 9), userId, message, type, timestamp: new Date(), isRead: false }, ...prev]);
  };

  const syncJourneysWithModuleTargets = (updatedModule: TrainingModule) => {
    setDepartments(prevDepts => prevDepts.map(dept => {
      const isTargeted = updatedModule.targetDepartmentIds.includes(dept.id);
      const isAlreadyInCore = dept.coreModuleIds.includes(updatedModule.id);
      if (isTargeted && !isAlreadyInCore) return { ...dept, coreModuleIds: [...dept.coreModuleIds, updatedModule.id] };
      else if (!isTargeted && isAlreadyInCore) return { ...dept, coreModuleIds: dept.coreModuleIds.filter(id => id !== updatedModule.id) };
      return dept;
    }));

    setJourneys(prevJourneys => {
      let nextJourneys = [...prevJourneys];
      updatedModule.targetRoleIds.forEach(roleId => {
        if (!nextJourneys.find(j => j.roleId === roleId)) {
          nextJourneys.push({ id: 'j' + Date.now() + Math.random(), roleId, progressionModuleIds: [] });
        }
      });
      return nextJourneys.map(j => {
        const isTargeted = updatedModule.targetRoleIds.includes(j.roleId);
        const isAlreadyInPath = j.progressionModuleIds.includes(updatedModule.id);
        if (isTargeted && !isAlreadyInPath) return { ...j, progressionModuleIds: [...j.progressionModuleIds, updatedModule.id] };
        else if (!isTargeted && isAlreadyInPath) return { ...j, progressionModuleIds: j.progressionModuleIds.filter(id => id !== updatedModule.id) };
        return j;
      });
    });
  };

  const handleCreateModule = (m: TrainingModule) => {
    setModules(prev => [...prev, m]);
    syncJourneysWithModuleTargets(m);
    volunteers.forEach(v => {
      const isTargetedByRole = v.roleIds.some(rid => m.targetRoleIds.includes(rid));
      const isTargetedByDept = v.roleIds.some(rid => {
        const role = roles.find(r => r.id === rid);
        return role && m.targetDepartmentIds.includes(role.departmentId);
      });
      if (m.isCompulsory || isTargetedByRole || isTargetedByDept) addNotification(v.id, `New Module: ${m.title}`, 'NEW_MODULE');
    });
  };

  const handleUpdateModule = (m: TrainingModule) => {
    setModules(prev => prev.map(curr => curr.id === m.id ? m : curr));
    syncJourneysWithModuleTargets(m);
  };

  const handleResetProgress = (volunteerId: string, moduleId?: string) => {
    setVolunteers(prev => prev.map(v => {
      if (v.id !== volunteerId) return v;
      if (!moduleId) return { ...v, completedChapterIds: [] };
      const module = modules.find(m => m.id === moduleId);
      if (!module) return v;
      const chapterIdsToRemove = module.chapters.map(ch => ch.id);
      return { ...v, completedChapterIds: v.completedChapterIds.filter(id => !chapterIdsToRemove.includes(id)) };
    }));
  };

  const handleResetChapter = (cId: string) => {
    if (!activePersona) return;
    setVolunteers(prev => prev.map(v => v.id === activePersona.id ? { ...v, completedChapterIds: v.completedChapterIds.filter(id => id !== cId) } : v));
  };

  const handleUpdateJourney = (roleId: string, progressionModuleIds: string[]) => {
    setJourneys(prev => {
      const existing = prev.find(p => p.roleId === roleId);
      if (existing) return prev.map(p => p.roleId === roleId ? { ...p, progressionModuleIds } : p);
      return [...prev, { id: Math.random().toString(36).substr(2, 9), roleId, progressionModuleIds }];
    });
    setModules(prevModules => prevModules.map(m => {
      if (m.isCompulsory) return m;
      const shouldHaveTarget = progressionModuleIds.includes(m.id);
      const hasTarget = m.targetRoleIds.includes(roleId);
      if (shouldHaveTarget && !hasTarget) return { ...m, targetRoleIds: [...m.targetRoleIds, roleId] };
      else if (!shouldHaveTarget && hasTarget) return { ...m, targetRoleIds: m.targetRoleIds.filter(id => id !== roleId) };
      return m;
    }));
  };

  const handleUpdateDepartmentCore = (deptId: string, coreModuleIds: string[]) => {
    setDepartments(prev => prev.map(d => d.id === deptId ? { ...d, coreModuleIds } : d));
    setModules(prevModules => prevModules.map(m => {
      if (m.isCompulsory) return m;
      const shouldHaveTarget = coreModuleIds.includes(m.id);
      const hasTarget = m.targetDepartmentIds.includes(deptId);
      if (shouldHaveTarget && !hasTarget) return { ...m, targetDepartmentIds: [...m.targetDepartmentIds, deptId] };
      else if (!shouldHaveTarget && hasTarget) return { ...m, targetDepartmentIds: m.targetDepartmentIds.filter(id => id !== deptId) };
      return m;
    }));
  };

  if (!isAuthenticated) {
    return showAuth ? (
      <AuthForm 
        onLogin={handleLogin} 
        onRegister={handleRegister} 
        onBack={() => setShowAuth(false)} 
      />
    ) : (
      <LandingPage onGetStarted={() => setShowAuth(true)} onLogin={() => setShowAuth(true)} />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar 
        currentView={view} 
        setView={(v) => { setView(v); if(v !== 'DASHBOARD') setPreviewModuleId(null); }} 
        isAdmin={!!loggedInUser?.isAdmin} 
        isImpersonating={!!impersonatedVolunteerId}
        onStopImpersonating={() => setImpersonatedVolunteerId(null)}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden text-gray-900">
        <Header 
          notifications={notifications.filter(n => !n.isRead && n.userId === loggedInUser?.id)} 
          onMarkRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))}
          currentUser={loggedInUser}
          volunteers={volunteers}
          onImpersonate={setImpersonatedVolunteerId}
          impersonatedId={impersonatedVolunteerId}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {view === 'DASHBOARD' && (
            <Dashboard 
              volunteers={volunteers} modules={modules} journeys={journeys} roles={roles} departments={departments}
              onCompleteChapter={(cId) => {
                setVolunteers(prev => prev.map(v => v.id === activePersona?.id ? { ...v, completedChapterIds: [...new Set([...v.completedChapterIds, cId])] } : v));
              }}
              onResetChapter={handleResetChapter}
              currentUser={activePersona || null}
              initialModuleId={previewModuleId || undefined}
            />
          )}
          {view === 'VOLUNTEERS' && loggedInUser?.isAdmin && (
            <VolunteerList 
              volunteers={volunteers} setVolunteers={setVolunteers} modules={modules} roles={roles} departments={departments} journeys={journeys}
              onUpdateVolunteer={(v) => setVolunteers(prev => prev.map(curr => curr.id === v.id ? v : curr))}
              onResetProgress={handleResetProgress}
              onViewAs={setImpersonatedVolunteerId}
            />
          )}
          {view === 'MODULES' && loggedInUser?.isAdmin && (
            <ModuleManager 
              modules={modules} 
              roles={roles} 
              departments={departments}
              onCreateModule={handleCreateModule} 
              onUpdateModule={handleUpdateModule} 
              onPreviewModule={(id) => { setPreviewModuleId(id); setView('DASHBOARD'); }} 
            />
          )}
          {view === 'JOURNEY_BUILDER' && loggedInUser?.isAdmin && (
            <JourneyBuilder 
              modules={modules} departments={departments} roles={roles} journeys={journeys}
              onUpdateJourney={handleUpdateJourney}
              onUpdateDepartmentCore={handleUpdateDepartmentCore}
              onUpdateDepartments={setDepartments}
              onUpdateRoles={setRoles}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
