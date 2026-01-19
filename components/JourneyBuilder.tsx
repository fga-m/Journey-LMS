
import React, { useState, useMemo } from 'react';
import { TrainingModule, Role, Department, Journey } from '../types';

interface JourneyBuilderProps {
  modules: TrainingModule[];
  departments: Department[];
  roles: Role[];
  journeys: Journey[];
  onUpdateJourney: (roleId: string, progressionIds: string[]) => void;
  onUpdateDepartmentCore: (deptId: string, coreIds: string[]) => void;
  onUpdateDepartments: (depts: Department[]) => Promise<void>;
  onUpdateRoles: (roles: Role[]) => Promise<void>;
  onDeleteDepartment: (id: string) => Promise<void>;
  onDeleteRole: (id: string) => Promise<void>;
}

const JourneyBuilder: React.FC<JourneyBuilderProps> = ({ 
  modules, departments, roles, journeys, onUpdateJourney, onUpdateDepartmentCore, onUpdateDepartments, onUpdateRoles, onDeleteDepartment, onDeleteRole
}) => {
  const [selectedDeptId, setSelectedDeptId] = useState<string>(departments[0]?.id || '');
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles.find(r => r.departmentId === departments[0]?.id)?.id || '');
  
  // Management States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [newName, setNewName] = useState('');

  const filteredRoles = useMemo(() => roles.filter(r => r.departmentId === selectedDeptId), [roles, selectedDeptId]);
  const activeRole = useMemo(() => roles.find(r => r.id === selectedRoleId), [roles, selectedRoleId]);
  const activeDept = useMemo(() => departments.find(d => d.id === selectedDeptId), [departments, selectedDeptId]);
  const activeJourney = useMemo(() => journeys.find(j => j.roleId === selectedRoleId), [journeys, selectedRoleId]);

  const availableModules = useMemo(() => {
    if (!activeDept || !activeRole) return [];
    return modules.filter(m => {
      if (m.isCompulsory) return false;
      const isAlreadyAssignedInPath = activeDept.coreModuleIds.includes(m.id) || (activeJourney?.progressionModuleIds || []).includes(m.id);
      if (isAlreadyAssignedInPath) return false;
      return m.targetDepartmentIds?.includes(activeDept.id) || m.targetRoleIds?.includes(activeRole.id) || (m.targetRoleIds?.length === 0 && m.targetDepartmentIds?.length === 0);
    });
  }, [modules, activeDept, activeRole, activeJourney]);

  const handleSaveDept = async () => {
    if (!newName.trim()) return;
    const newDept: Department = { id: 'd-' + Date.now(), name: newName.trim(), coreModuleIds: [] };
    await onUpdateDepartments([...departments, newDept]);
    setNewName('');
    setIsAddingDept(false);
    setSelectedDeptId(newDept.id);
  };

  const handleSaveRole = async () => {
    if (!newName.trim() || !selectedDeptId) return;
    const newRole: Role = { id: 'r-' + Date.now(), name: newName.trim(), departmentId: selectedDeptId };
    await onUpdateRoles([...roles, newRole]);
    setNewName('');
    setIsAddingRole(false);
    setSelectedRoleId(newRole.id);
  };

  const startEditing = (e: React.MouseEvent, id: string, currentName: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditValue(currentName);
  };

  const saveEdit = async (type: 'DEPT' | 'ROLE') => {
    if (!editingId || !editValue.trim()) {
      setEditingId(null);
      return;
    }
    if (type === 'DEPT') {
      const updated = departments.map(d => d.id === editingId ? { ...d, name: editValue } : d);
      await onUpdateDepartments(updated);
    } else {
      const updated = roles.map(r => r.id === editingId ? { ...r, name: editValue } : r);
      await onUpdateRoles(updated);
    }
    setEditingId(null);
  };

  const confirmDelete = async (type: 'DEPT' | 'ROLE', id: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${type === 'DEPT' ? 'department and all its roles' : 'role'}?`)) return;
    if (type === 'DEPT') {
      await onDeleteDepartment(id);
      if (selectedDeptId === id) setSelectedDeptId(departments[0]?.id || '');
    } else {
      await onDeleteRole(id);
      if (selectedRoleId === id) setSelectedRoleId('');
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">Organization Map</h2>
          <p className="text-xs sm:text-sm text-gray-500">Design ministry structure and training flow.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-y-auto lg:overflow-hidden">
        {/* Step 1: Departments */}
        <div className="w-full lg:w-72 flex flex-col bg-white border border-gray-100 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm overflow-hidden shrink-0">
          <div className="p-5 sm:p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Departments</h3>
            <button onClick={() => setIsAddingDept(true)} className="w-6 h-6 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
          <div className="p-4 space-y-2 overflow-y-auto max-h-60 lg:max-h-full scrollbar-hide">
            {isAddingDept && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-2 animate-fadeIn">
                <input autoFocus placeholder="Dept Name..." className="w-full bg-white border border-blue-200 p-2 rounded-lg text-xs font-bold outline-none" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveDept()} />
                <div className="flex gap-2">
                  <button onClick={handleSaveDept} className="flex-1 bg-blue-600 text-white text-[9px] font-black uppercase py-1 rounded">Save</button>
                  <button onClick={() => setIsAddingDept(false)} className="flex-1 bg-gray-200 text-gray-600 text-[9px] font-black uppercase py-1 rounded">Cancel</button>
                </div>
              </div>
            )}
            {departments.map(d => (
              <div key={d.id} onClick={() => { setSelectedDeptId(d.id); setSelectedRoleId(roles.find(r => r.departmentId === d.id)?.id || ''); }} className={`p-4 rounded-xl cursor-pointer transition-all border group relative ${selectedDeptId === d.id ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white border-transparent hover:bg-gray-50 text-gray-700'}`}>
                {editingId === d.id ? (
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <input autoFocus className="flex-1 bg-white/20 text-white text-sm font-bold p-1 rounded border-none outline-none" value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => saveEdit('DEPT')} onKeyDown={e => e.key === 'Enter' && saveEdit('DEPT')} />
                  </div>
                ) : (
                  <>
                    <p className="font-bold text-sm truncate pr-6">{d.name}</p>
                    <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${selectedDeptId === d.id ? 'text-blue-100' : 'text-gray-400'}`}>{roles.filter(r => r.departmentId === d.id).length} Roles</p>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => startEditing(e, d.id, d.name)} className="p-1 hover:bg-white/20 rounded text-inherit"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                      <button onClick={(e) => { e.stopPropagation(); confirmDelete('DEPT', d.id); }} className="p-1 hover:bg-white/20 rounded text-inherit"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 2: Roles */}
        <div className="w-full lg:w-72 flex flex-col bg-white border border-gray-100 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm overflow-hidden shrink-0">
          <div className="p-5 sm:p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Roles</h3>
            {selectedDeptId && (
              <button onClick={() => setIsAddingRole(true)} className="w-6 h-6 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              </button>
            )}
          </div>
          <div className="p-4 space-y-2 overflow-y-auto max-h-60 lg:max-h-full scrollbar-hide">
            {isAddingRole && (
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2 animate-fadeIn">
                <input autoFocus placeholder="Role Name..." className="w-full bg-white border border-indigo-200 p-2 rounded-lg text-xs font-bold outline-none" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveRole()} />
                <div className="flex gap-2">
                  <button onClick={handleSaveRole} className="flex-1 bg-indigo-600 text-white text-[9px] font-black uppercase py-1 rounded">Save</button>
                  <button onClick={() => setIsAddingRole(false)} className="flex-1 bg-gray-200 text-gray-600 text-[9px] font-black uppercase py-1 rounded">Cancel</button>
                </div>
              </div>
            )}
            {filteredRoles.map(r => (
              <div key={r.id} onClick={() => setSelectedRoleId(r.id)} className={`p-4 rounded-xl cursor-pointer transition-all border group relative ${selectedRoleId === r.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white border-transparent hover:bg-gray-50 text-gray-700'}`}>
                {editingId === r.id ? (
                  <input autoFocus className="w-full bg-white/20 text-white text-sm font-bold p-1 rounded border-none outline-none" value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => saveEdit('ROLE')} onKeyDown={e => e.key === 'Enter' && saveEdit('ROLE')} />
                ) : (
                  <>
                    <p className="font-bold text-sm truncate pr-6">{r.name}</p>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => startEditing(e, r.id, r.name)} className="p-1 hover:bg-white/20 rounded text-inherit"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                      <button onClick={(e) => { e.stopPropagation(); confirmDelete('ROLE', r.id); }} className="p-1 hover:bg-white/20 rounded text-inherit"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 3: Lifecycle Content */}
        <div className="flex-1 flex flex-col bg-white border border-gray-100 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm overflow-hidden min-w-0">
          {!selectedRoleId ? (
            <div className="h-full flex flex-col items-center justify-center p-10 sm:p-20 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-6 text-gray-200">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
              </div>
              <h3 className="text-lg font-black text-gray-800">Assign Training Journey</h3>
              <p className="text-xs text-gray-400 mt-2 max-w-xs">Select a department and role on the left to customize its specific learning flow.</p>
            </div>
          ) : (
            <div className="h-full flex flex-col min-h-0">
              <div className="p-6 sm:p-8 border-b border-gray-50 bg-gray-50/50 shrink-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{activeDept?.name}</span>
                  <span className="text-gray-300">/</span>
                  <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{activeRole?.name}</span>
                </div>
                <h3 className="text-xl font-black text-gray-900">Training Lifecycle</h3>
              </div>
              <div className="flex-1 flex flex-col md:flex-row min-h-0">
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 scrollbar-hide">
                  <section className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500">Departmental Foundation</h4>
                    <div className="grid gap-2">
                      {activeDept?.coreModuleIds.map(mid => (
                        <div key={mid} className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex justify-between items-center group">
                          <span className="text-xs font-bold text-gray-800 truncate pr-2">{modules.find(m => m.id === mid)?.title}</span>
                          <button onClick={() => activeDept && onUpdateDepartmentCore(activeDept.id, activeDept.coreModuleIds.filter(id => id !== mid))} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      ))}
                      {(!activeDept?.coreModuleIds || activeDept.coreModuleIds.length === 0) && <p className="text-[10px] text-gray-300 font-bold uppercase py-4 border-2 border-dashed border-gray-100 rounded-2xl text-center">No core modules assigned</p>}
                    </div>
                  </section>
                  <section className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Specific Role Pathway</h4>
                    <div className="grid gap-2">
                      {activeJourney?.progressionModuleIds.map(mid => (
                        <div key={mid} className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex justify-between items-center group">
                          <span className="text-xs font-bold text-gray-800 truncate pr-2">{modules.find(m => m.id === mid)?.title}</span>
                          <button onClick={() => onUpdateJourney(activeRole!.id, activeJourney!.progressionModuleIds.filter(id => id !== mid))} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      ))}
                      {(!activeJourney?.progressionModuleIds || activeJourney.progressionModuleIds.length === 0) && <p className="text-[10px] text-gray-300 font-bold uppercase py-4 border-2 border-dashed border-gray-100 rounded-2xl text-center">No specialized modules assigned</p>}
                    </div>
                  </section>
                </div>
                <div className="w-full md:w-64 bg-slate-900 text-white p-6 shrink-0 flex flex-col border-t md:border-t-0 md:border-l border-white/5 scrollbar-hide">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Available Content</h4>
                  <div className="space-y-3 overflow-y-auto max-h-60 md:max-h-full pr-1">
                    {availableModules.map(m => (
                      <div key={m.id} className="p-3 bg-slate-800 border border-slate-700 rounded-xl hover:border-slate-500 transition-all">
                        <h4 className="text-[10px] font-bold mb-3 line-clamp-2 leading-tight">{m.title}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => activeDept && onUpdateDepartmentCore(activeDept.id, [...activeDept.coreModuleIds, m.id])} className="py-2 bg-amber-600/20 text-amber-500 text-[8px] font-black uppercase tracking-tighter rounded-lg hover:bg-amber-600/40 transition-colors">To Dept</button>
                          <button onClick={() => activeRole && onUpdateJourney(activeRole.id, [...(activeJourney?.progressionModuleIds || []), m.id])} className="py-2 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-tighter rounded-lg hover:bg-indigo-500 transition-colors">To Role</button>
                        </div>
                      </div>
                    ))}
                    {availableModules.length === 0 && <p className="text-[9px] text-slate-600 font-bold uppercase text-center mt-10 italic">All matching modules assigned</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JourneyBuilder;
