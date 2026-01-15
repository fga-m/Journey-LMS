
import React, { useState, useMemo } from 'react';
import { TrainingModule, Role, Department, Journey } from '../types';

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

  // Derived data
  const filteredRoles = useMemo(() => roles.filter(r => r.departmentId === selectedDeptId), [roles, selectedDeptId]);
  const activeRole = useMemo(() => roles.find(r => r.id === selectedRoleId), [roles, selectedRoleId]);
  const activeDept = useMemo(() => departments.find(d => d.id === selectedDeptId), [departments, selectedDeptId]);
  const activeJourney = useMemo(() => journeys.find(j => j.roleId === selectedRoleId), [journeys, selectedRoleId]);

  const availableModules = useMemo(() => {
    if (!activeDept || !activeRole) return [];

    return modules.filter(m => {
      // 1. Must NOT be a Global Compulsory module (those are handled automatically)
      if (m.isCompulsory) return false;

      // 2. Must NOT already be in the ordered paths
      const isAlreadyAssignedInPath = 
        activeDept.coreModuleIds.includes(m.id) || 
        (activeJourney?.progressionModuleIds || []).includes(m.id);
      
      if (isAlreadyAssignedInPath) return false;

      // 3. To appear in "Unassigned", it must either:
      // a) Be targeted to this Dept/Role in the Library but not placed in a path yet
      const isTargetedToThisDept = m.targetDepartmentIds?.includes(activeDept.id);
      const isTargetedToThisRole = m.targetRoleIds?.includes(activeRole.id);

      // b) Be a "free agent" (assigned to nothing else yet) - This allows creating from Builder too
      const isFreeAgent = (m.targetRoleIds?.length === 0 && m.targetDepartmentIds?.length === 0);

      return isTargetedToThisDept || isTargetedToThisRole || isFreeAgent;
    });
  }, [modules, activeDept, activeRole, activeJourney]);

  // Handlers
  const handleAddDept = () => {
    if (!newName.trim()) return;
    const newId = 'd' + Date.now();
    onUpdateDepartments([...departments, { id: newId, name: newName.trim(), coreModuleIds: [] }]);
    setNewName('');
    setIsAddingDept(false);
    setSelectedDeptId(newId);
  };

  const handleAddRole = () => {
    if (!newName.trim() || !selectedDeptId) return;
    const newId = 'r' + Date.now();
    onUpdateRoles([...roles, { id: newId, name: newName.trim(), departmentId: selectedDeptId }]);
    setNewName('');
    setIsAddingRole(false);
    setSelectedRoleId(newId);
  };

  const handleDeleteDept = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Delete this department and all associated role assignments?")) {
      onUpdateDepartments(departments.filter(d => d.id !== id));
      if (selectedDeptId === id) setSelectedDeptId(departments.find(d => d.id !== id)?.id || '');
    }
  };

  const handleDeleteRole = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Remove this role?")) {
      onUpdateRoles(roles.filter(r => r.id !== id));
      if (selectedRoleId === id) setSelectedRoleId(filteredRoles.find(r => r.id !== id)?.id || '');
    }
  };

  const saveEdit = (type: 'DEPT' | 'ROLE') => {
    if (!editValue.trim() || !editingId) return;
    if (type === 'DEPT') {
      onUpdateDepartments(departments.map(d => d.id === editingId ? { ...d, name: editValue.trim() } : d));
    } else {
      onUpdateRoles(roles.map(r => r.id === editingId ? { ...r, name: editValue.trim() } : r));
    }
    setEditingId(null);
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900">Organization Map</h2>
          <p className="text-sm text-gray-500">Define your hierarchy and training flow in one view.</p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        {/* Column 1: Departments */}
        <div className="w-72 flex flex-col bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Departments</h3>
            <button onClick={() => setIsAddingDept(true)} className="w-6 h-6 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {isAddingDept && (
              <div className="p-2 animate-slideDown">
                <input 
                  autoFocus
                  placeholder="Dept Name..." 
                  className="w-full px-4 py-2 text-sm border-2 border-blue-100 rounded-xl outline-none focus:border-blue-500"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddDept()}
                  onBlur={() => { if(!newName) setIsAddingDept(false); }}
                />
              </div>
            )}
            {departments.map(d => (
              <div 
                key={d.id}
                onClick={() => { setSelectedDeptId(d.id); setSelectedRoleId(roles.find(r => r.departmentId === d.id)?.id || ''); }}
                className={`group relative p-4 rounded-2xl cursor-pointer transition-all border ${selectedDeptId === d.id ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' : 'bg-white border-transparent hover:bg-gray-50 text-gray-700'}`}
              >
                {editingId === d.id ? (
                  <input 
                    autoFocus
                    className="w-full bg-white text-gray-900 px-2 py-1 rounded-lg outline-none"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    onBlur={() => saveEdit('DEPT')}
                    onKeyDown={e => e.key === 'Enter' && saveEdit('DEPT')}
                  />
                ) : (
                  <>
                    <p className="font-bold text-sm truncate">{d.name}</p>
                    <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${selectedDeptId === d.id ? 'text-blue-100' : 'text-gray-400'}`}>
                      {roles.filter(r => r.departmentId === d.id).length} Roles
                    </p>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); setEditingId(d.id); setEditValue(d.name); }} className="p-1 hover:text-amber-400"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                      <button onClick={(e) => handleDeleteDept(e, d.id)} className="p-1 hover:text-red-400"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Arrow Connector 1 */}
        <div className="flex items-center text-gray-200">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M13.025 1l-2.847 2.828 6.176 6.172h-16.354v4h16.354l-6.176 6.172 2.847 2.828 10.975-11z"/></svg>
        </div>

        {/* Column 2: Roles */}
        <div className="w-72 flex flex-col bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Roles</h3>
            {selectedDeptId && (
              <button onClick={() => setIsAddingRole(true)} className="w-6 h-6 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {!selectedDeptId ? (
              <div className="h-full flex items-center justify-center text-center p-8">
                <p className="text-xs text-gray-300 italic">Select a department to manage roles.</p>
              </div>
            ) : (
              <>
                {isAddingRole && (
                  <div className="p-2 animate-slideDown">
                    <input 
                      autoFocus
                      placeholder="Role Name..." 
                      className="w-full px-4 py-2 text-sm border-2 border-blue-100 rounded-xl outline-none focus:border-blue-500"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddRole()}
                      onBlur={() => { if(!newName) setIsAddingRole(false); }}
                    />
                  </div>
                )}
                {filteredRoles.map(r => (
                  <div 
                    key={r.id}
                    onClick={() => setSelectedRoleId(r.id)}
                    className={`group relative p-4 rounded-2xl cursor-pointer transition-all border ${selectedRoleId === r.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white border-transparent hover:bg-gray-50 text-gray-700'}`}
                  >
                    {editingId === r.id ? (
                      <input 
                        autoFocus
                        className="w-full bg-white text-gray-900 px-2 py-1 rounded-lg outline-none"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        onBlur={() => saveEdit('ROLE')}
                        onKeyDown={e => e.key === 'Enter' && saveEdit('ROLE')}
                      />
                    ) : (
                      <>
                        <p className="font-bold text-sm truncate">{r.name}</p>
                        <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${selectedRoleId === r.id ? 'text-indigo-100' : 'text-gray-400'}`}>
                          {journeys.find(j => j.roleId === r.id)?.progressionModuleIds.length || 0} Progression Steps
                        </p>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); setEditingId(r.id); setEditValue(r.name); }} className="p-1 hover:text-amber-400"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                          <button onClick={(e) => handleDeleteRole(e, r.id)} className="p-1 hover:text-red-400"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Arrow Connector 2 */}
        <div className="flex items-center text-gray-200">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M13.025 1l-2.847 2.828 6.176 6.172h-16.354v4h16.354l-6.176 6.172 2.847 2.828 10.975-11z"/></svg>
        </div>

        {/* Column 3: The Journey Builder */}
        <div className="flex-1 flex flex-col bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden">
          {!selectedRoleId ? (
            <div className="h-full flex flex-col items-center justify-center p-20 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-xl font-black text-gray-800">Final Step: Define Journey</h3>
              <p className="text-sm text-gray-400 mt-2 max-w-xs">Select a role on the left to architect its training progression and shared departmental modules.</p>
            </div>
          ) : (
            <div className="h-full flex flex-col min-h-0">
              <div className="p-8 border-b border-gray-50 bg-gray-50/50">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{activeDept?.name}</span>
                  <span className="text-gray-300">/</span>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{activeRole?.name}</span>
                </div>
                <h3 className="text-xl font-black text-gray-900">Training Lifecycle</h3>
              </div>

              <div className="flex-1 flex min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
                  {/* Shared Dept Core */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-amber-500">Ministry Step (Shared Core)</h4>
                      <span className="text-[10px] text-gray-400 font-bold">{activeDept?.coreModuleIds.length || 0} Modules</span>
                    </div>
                    <div className="space-y-2">
                      {activeDept?.coreModuleIds.length === 0 ? (
                        <div className="p-8 text-center border-2 border-dashed border-gray-50 rounded-2xl">
                          <p className="text-xs text-gray-300 italic">No departmental core modules added.</p>
                        </div>
                      ) : activeDept?.coreModuleIds.map(mid => (
                        <div key={mid} className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex justify-between items-center group/item hover:bg-white hover:shadow-md transition-all">
                          <span className="text-sm font-bold text-gray-800">{modules.find(m => m.id === mid)?.title}</span>
                          <button 
                            onClick={() => activeDept && onUpdateDepartmentCore(activeDept.id, activeDept.coreModuleIds.filter(id => id !== mid))} 
                            className="p-1.5 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Role Specific */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-500">Role Progression Path</h4>
                      <span className="text-[10px] text-gray-400 font-bold">{activeJourney?.progressionModuleIds.length || 0} Modules</span>
                    </div>
                    <div className="space-y-2">
                      {activeJourney?.progressionModuleIds.length === 0 ? (
                        <div className="p-8 text-center border-2 border-dashed border-gray-50 rounded-2xl">
                          <p className="text-xs text-gray-300 italic">No role-specific modules added yet.</p>
                        </div>
                      ) : activeJourney?.progressionModuleIds.map(mid => (
                        <div key={mid} className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex justify-between items-center group/item hover:bg-white hover:shadow-md transition-all">
                          <span className="text-sm font-bold text-gray-800">{modules.find(m => m.id === mid)?.title}</span>
                          <button 
                            onClick={() => onUpdateJourney(activeRole!.id, activeJourney!.progressionModuleIds.filter(id => id !== mid))} 
                            className="p-1.5 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="w-80 bg-slate-900 text-white p-8 flex flex-col shadow-2xl overflow-hidden border-l border-white/5">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Unassigned Modules</h4>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                    {availableModules.length === 0 ? (
                      <div className="py-20 text-center border border-slate-800 rounded-3xl">
                        <p className="text-xs text-slate-600 italic">No available library modules for this selection.</p>
                      </div>
                    ) : availableModules.map(m => (
                      <div key={m.id} className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl hover:bg-slate-800 transition-all group">
                        <h4 className="text-[11px] font-bold text-white mb-4 line-clamp-2">{m.title}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => activeDept && onUpdateDepartmentCore(activeDept.id, [...activeDept.coreModuleIds, m.id])} 
                            className="py-2 bg-amber-600/10 text-amber-500 hover:bg-amber-600 hover:text-white text-[8px] font-black uppercase tracking-widest rounded-lg transition-all border border-amber-600/20"
                          >
                            Dept Core
                          </button>
                          <button 
                            onClick={() => activeRole && onUpdateJourney(activeRole.id, [...(activeJourney?.progressionModuleIds || []), m.id])} 
                            className="py-2 bg-indigo-600 text-white hover:bg-indigo-500 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all shadow-lg"
                          >
                            Role Path
                          </button>
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
