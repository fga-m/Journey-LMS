
import React, { useState, useMemo } from 'react';
import { TrainingModule, Role, Department, Journey } from '../types';
import { supabase } from '../supabase.ts';

interface JourneyBuilderProps {
  modules: TrainingModule[];
  departments: Department[];
  roles: Role[];
  journeys: Journey[];
  onUpdateJourney: (roleId: string, progressionIds: string[]) => void;
  onUpdateDepartmentCore: (deptId: string, coreIds: string[]) => void;
  onUpdateDepartments: (depts: Department[]) => void;
  onUpdateRoles: (roles: Role[]) => void;
}

const JourneyBuilder: React.FC<JourneyBuilderProps> = ({ 
  modules, departments, roles, journeys, onUpdateJourney, onUpdateDepartmentCore, onUpdateDepartments, onUpdateRoles
}) => {
  const [selectedDeptId, setSelectedDeptId] = useState<string>(departments[0]?.id || '');
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles.find(r => r.departmentId === departments[0]?.id)?.id || '');
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

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

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn pb-10">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">Organization Map</h2>
        <p className="text-xs sm:text-sm text-gray-500">Design ministry structure and training flow.</p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-y-auto lg:overflow-hidden">
        {/* Step 1: Departments */}
        <div className="w-full lg:w-72 flex flex-col bg-white border border-gray-100 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm overflow-hidden shrink-0">
          <div className="p-5 sm:p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Departments</h3>
            <button onClick={() => setIsAddingDept(true)} className="w-6 h-6 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
          <div className="p-4 space-y-2 overflow-y-auto max-h-60 lg:max-h-full">
            {departments.map(d => (
              <div key={d.id} onClick={() => { setSelectedDeptId(d.id); setSelectedRoleId(roles.find(r => r.departmentId === d.id)?.id || ''); }} className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedDeptId === d.id ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white border-transparent hover:bg-gray-50 text-gray-700'}`}>
                <p className="font-bold text-sm truncate">{d.name}</p>
                <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${selectedDeptId === d.id ? 'text-blue-100' : 'text-gray-400'}`}>{roles.filter(r => r.departmentId === d.id).length} Roles</p>
              </div>
            ))}
          </div>
        </div>

        {/* Step 2: Roles */}
        <div className="w-full lg:w-72 flex flex-col bg-white border border-gray-100 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm overflow-hidden shrink-0">
          <div className="p-5 sm:p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Roles</h3>
            {selectedDeptId && (
              <button onClick={() => setIsAddingRole(true)} className="w-6 h-6 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              </button>
            )}
          </div>
          <div className="p-4 space-y-2 overflow-y-auto max-h-60 lg:max-h-full">
            {filteredRoles.map(r => (
              <div key={r.id} onClick={() => setSelectedRoleId(r.id)} className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedRoleId === r.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white border-transparent hover:bg-gray-50 text-gray-700'}`}>
                <p className="font-bold text-sm truncate">{r.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Step 3: Lifecycle */}
        <div className="flex-1 flex flex-col bg-white border border-gray-100 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm overflow-hidden min-w-0">
          {!selectedRoleId ? (
            <div className="h-full flex flex-col items-center justify-center p-10 sm:p-20 text-center">
              <h3 className="text-lg font-black text-gray-800">Final Step: Define Journey</h3>
              <p className="text-xs text-gray-400 mt-2 max-w-xs">Select a role to architect its training path.</p>
            </div>
          ) : (
            <div className="h-full flex flex-col min-h-0">
              <div className="p-6 sm:p-8 border-b border-gray-50 bg-gray-50/50 shrink-0">
                <div className="flex items-center space-x-2 mb-1"><span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{activeDept?.name}</span><span className="text-gray-300">/</span><span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{activeRole?.name}</span></div>
                <h3 className="text-xl font-black text-gray-900">Training Lifecycle</h3>
              </div>
              <div className="flex-1 flex flex-col md:flex-row min-h-0">
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 scrollbar-hide">
                  <section className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500">Dept Core</h4>
                    <div className="space-y-2">
                      {activeDept?.coreModuleIds.map(mid => (
                        <div key={mid} className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-800 truncate pr-2">{modules.find(m => m.id === mid)?.title}</span>
                          <button onClick={() => activeDept && onUpdateDepartmentCore(activeDept.id, activeDept.coreModuleIds.filter(id => id !== mid))} className="text-red-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Role Path</h4>
                    <div className="space-y-2">
                      {activeJourney?.progressionModuleIds.map(mid => (
                        <div key={mid} className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-800 truncate pr-2">{modules.find(m => m.id === mid)?.title}</span>
                          <button onClick={() => onUpdateJourney(activeRole!.id, activeJourney!.progressionModuleIds.filter(id => id !== mid))} className="text-red-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
                <div className="w-full md:w-64 bg-slate-900 text-white p-6 shrink-0 flex flex-col border-t md:border-t-0 md:border-l border-white/5">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Unassigned</h4>
                  <div className="space-y-3 overflow-y-auto max-h-60 md:max-h-full">
                    {availableModules.map(m => (
                      <div key={m.id} className="p-3 bg-slate-800 rounded-xl">
                        <h4 className="text-[10px] font-bold mb-3 truncate">{m.title}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => activeDept && onUpdateDepartmentCore(activeDept.id, [...activeDept.coreModuleIds, m.id])} className="py-1.5 bg-amber-600/20 text-amber-500 text-[8px] font-black uppercase tracking-tighter rounded-lg">Dept</button>
                          <button onClick={() => activeRole && onUpdateJourney(activeRole.id, [...(activeJourney?.progressionModuleIds || []), m.id])} className="py-1.5 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-tighter rounded-lg">Role</button>
                        </div>
                      </div>
                    ))}
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
