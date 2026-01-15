
import React, { useState } from 'react';
// Corrected import: Journey is the exported type in types.ts, not Pathway.
import { TrainingModule, Role, Volunteer, Journey } from '../types';

interface TrainingPathManagerProps {
  modules: TrainingModule[];
  volunteers: Volunteer[];
  // Corrected type to Journey from types.ts
  pathways: Journey[];
  // Added roles prop to fix 'Role' type being used as a value
  roles: Role[];
  onUpdatePathway: (role: Role, moduleIds: string[]) => void;
}

const TrainingPathManager: React.FC<TrainingPathManagerProps> = ({ modules, volunteers, pathways, roles, onUpdatePathway }) => {
  // Use roles[0] instead of Role.USHER which doesn't exist on the Role type (it's a string alias)
  const [selectedRole, setSelectedRole] = useState<Role>(roles[0] || '');

  const roleModules = modules.filter(m => m.targetRoles.includes(selectedRole) && !m.isCompulsory);
  const currentPathway = pathways.find(p => p.role === selectedRole);
  const orderedModuleIds = currentPathway?.moduleIds || [];

  // Modules that ARE in the current role's pathway (in order)
  const pathwayModules = orderedModuleIds
    .map(id => modules.find(m => m.id === id))
    .filter(Boolean) as TrainingModule[];

  // Modules that ARE assigned to this role but NOT in the pathway yet
  const unassignedModules = roleModules.filter(m => !orderedModuleIds.includes(m.id));

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const newOrder = [...orderedModuleIds];
    [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
    onUpdatePathway(selectedRole, newOrder);
  };

  const moveDown = (idx: number) => {
    if (idx === orderedModuleIds.length - 1) return;
    const newOrder = [...orderedModuleIds];
    [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
    onUpdatePathway(selectedRole, newOrder);
  };

  const addToPathway = (id: string) => {
    onUpdatePathway(selectedRole, [...orderedModuleIds, id]);
  };

  const removeFromPathway = (id: string) => {
    onUpdatePathway(selectedRole, orderedModuleIds.filter(mid => mid !== id));
  };

  const compulsoryModules = modules.filter(m => m.isCompulsory);
  
  return (
    <div className="space-y-12 pb-20 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Pathway Architect</h2>
                <p className="text-sm text-gray-500">Design the precise order of learning modules for each specialized role.</p>
            </div>
            <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                {/* Use the roles prop instead of Object.values(Role) since Role is a type */}
                {roles.map(role => (
                    <button
                        key={role}
                        onClick={() => setSelectedRole(role)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedRole === role ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
                    >
                        {role}
                    </button>
                ))}
            </div>
        </div>

        {/* Global Core Path (Phase 1) */}
        <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Foundation Path</h3>
            <p className="text-sm text-gray-400 mb-8 max-w-xl">Every volunteer, regardless of role, must complete these modules first before specialized pathways unlock.</p>
            
            <div className="flex flex-wrap gap-4">
                {compulsoryModules.map((m, idx) => (
                    <div key={m.id} className="flex-1 min-w-[200px] p-6 bg-red-50/50 rounded-3xl border border-red-100 flex items-center">
                        <span className="w-8 h-8 bg-white border border-red-200 rounded-lg flex items-center justify-center text-xs font-black text-red-500 mr-4 shrink-0">{idx + 1}</span>
                        <div>
                            <p className="text-sm font-bold text-gray-800">{m.title}</p>
                            <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{m.durationMinutes} min</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Role Specialized Architect */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* The Active Pathway */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">The {selectedRole} Journey</h3>
                        <p className="text-xs text-gray-400 mt-1">Modules will appear on the user dashboard in this order.</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{pathwayModules.length} Modules</span>
                </div>

                <div className="flex-1 space-y-4">
                    {pathwayModules.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-100 rounded-[2rem]">
                            <p className="text-sm text-gray-400">No modules added to this pathway yet.</p>
                            <p className="text-xs text-gray-300 mt-1">Add modules from the inventory on the right.</p>
                        </div>
                    ) : (
                        pathwayModules.map((m, idx) => (
                            <div key={m.id} className="group p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-white transition-all flex items-center">
                                <div className="mr-4">
                                    <div className="w-8 h-8 bg-white rounded-full flex flex-col items-center justify-center shadow-sm border border-gray-100">
                                        <button onClick={() => moveUp(idx)} className="text-gray-300 hover:text-blue-600 disabled:opacity-10" disabled={idx === 0}>
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" /></svg>
                                        </button>
                                        <button onClick={() => moveDown(idx)} className="text-gray-300 hover:text-blue-600 disabled:opacity-10" disabled={idx === pathwayModules.length - 1}>
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-gray-800">{m.title}</h4>
                                    <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">{m.description}</p>
                                </div>
                                <button 
                                    onClick={() => removeFromPathway(m.id)}
                                    className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
                
                {pathwayModules.length > 1 && (
                    <div className="mt-8 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">Path sequence auto-saves upon reordering</span>
                    </div>
                )}
            </div>

            {/* Role Module Inventory */}
            <div className="space-y-6 flex flex-col h-full">
                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex-1 overflow-y-auto">
                    <h3 className="text-xl font-bold mb-2">Module Inventory</h3>
                    <p className="text-xs text-slate-400 mb-8">Unassigned modules specifically tagged for the {selectedRole} role.</p>
                    
                    <div className="space-y-4">
                        {unassignedModules.length === 0 ? (
                            <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                                <p className="text-sm text-slate-500">No unassigned modules for this role.</p>
                                <p className="text-xs text-slate-600 mt-1">Create more in the "Modules" tab.</p>
                            </div>
                        ) : (
                            unassignedModules.map(m => (
                                <div key={m.id} className="p-5 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-between group">
                                    <div>
                                        <h4 className="text-sm font-bold text-white">{m.title}</h4>
                                        <p className="text-[10px] text-slate-500 mt-1">{m.durationMinutes} min read/watch</p>
                                    </div>
                                    <button 
                                        onClick={() => addToPathway(m.id)}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-lg active:scale-95"
                                    >
                                        Add to Path
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-50 text-green-500 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-800">{volunteers.filter(v => v.roles.includes(selectedRole)).length} Impacted Users</p>
                            <p className="text-[10px] text-gray-400">Volunteers in the {selectedRole} department</p>
                        </div>
                    </div>
                    <div className="h-8 w-px bg-gray-100"></div>
                    <div className="flex -space-x-2">
                        {volunteers.filter(v => v.roles.includes(selectedRole)).slice(0, 3).map(v => (
                            <img key={v.id} className="w-8 h-8 rounded-full border-2 border-white" src={`https://picsum.photos/seed/${v.id}/32/32`} alt="" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default TrainingPathManager;
