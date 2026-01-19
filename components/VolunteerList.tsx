import React, { useState, useMemo } from 'react';
import { Volunteer, Role, TrainingModule, Department, Journey } from '../types.ts';

interface VolunteerListProps {
  volunteers: Volunteer[];
  setVolunteers: React.Dispatch<React.SetStateAction<Volunteer[]>>;
  modules: TrainingModule[];
  roles: Role[];
  departments: Department[];
  journeys: Journey[];
  onUpdateVolunteer: (v: Volunteer) => void;
  onResetProgress: (volunteerId: string, moduleId?: string) => void;
  onViewAs: (id: string) => void;
}

type SortOption = 'NAME_ASC' | 'NAME_DESC' | 'USERNAME' | 'JOIN_DATE_NEW' | 'JOIN_DATE_OLD';

const VolunteerList: React.FC<VolunteerListProps> = ({ volunteers, modules, roles, departments, journeys, onUpdateVolunteer, onResetProgress, onViewAs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('NAME_ASC');

  const processedVolunteers = useMemo(() => {
    let result = volunteers.filter(v => 
      v.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      v.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      switch (sortBy) {
        case 'NAME_ASC': return a.fullName.localeCompare(b.fullName);
        case 'NAME_DESC': return b.fullName.localeCompare(a.fullName);
        case 'USERNAME': return a.username.localeCompare(b.username);
        case 'JOIN_DATE_NEW': return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
        case 'JOIN_DATE_OLD': return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
        default: return 0;
      }
    });

    return result;
  }, [volunteers, searchTerm, sortBy]);

  const resettingVolunteer = useMemo(() => 
    volunteers.find(v => v.id === resettingId) || null, 
  [volunteers, resettingId]);

  const assignedModulesForReset = useMemo(() => {
    if (!resettingVolunteer) return [];
    const assignedIds = new Set<string>();
    modules.filter(m => m.isCompulsory).forEach(m => assignedIds.add(m.id));
    resettingVolunteer.roleIds.forEach(roleId => {
      const role = roles.find(r => r.id === roleId);
      if (role) {
        const dept = departments.find(d => d.id === role.departmentId);
        if (dept) dept.coreModuleIds.forEach(id => assignedIds.add(id));
        const journey = journeys.find(j => j.roleId === roleId);
        if (journey) journey.progressionModuleIds.forEach(id => assignedIds.add(id));
      }
    });
    return modules.filter(m => assignedIds.has(m.id));
  }, [resettingVolunteer, modules, roles, departments, journeys]);

  const handleToggleRole = (rid: string) => {
    const v = volunteers.find(curr => curr.id === editingId);
    if (!v) return;
    const roleIds = v.roleIds.includes(rid) ? v.roleIds.filter(id => id !== rid) : [...v.roleIds, rid];
    onUpdateVolunteer({ ...v, roleIds });
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden text-gray-900 animate-fadeIn">
      <div className="p-10 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gray-50/30">
        <div className="flex-1">
          <h2 className="text-3xl font-black tracking-tight text-gray-900">Volunteer Directory</h2>
          <p className="text-sm text-gray-500 mt-1">Manage ministry roles and oversee training progression.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <input 
              type="text" 
              placeholder="Search volunteers..." 
              className="w-full bg-white border-2 border-gray-100 p-4 pl-12 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-semibold shadow-sm" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
            <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <div className="relative w-full sm:w-48">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full bg-white border-2 border-gray-100 p-4 pl-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-xs font-black uppercase tracking-widest appearance-none shadow-sm cursor-pointer"
            >
              <option value="NAME_ASC">Name (A-Z)</option>
              <option value="NAME_DESC">Name (Z-A)</option>
              <option value="USERNAME">By Username</option>
              <option value="JOIN_DATE_NEW">Newest Joiner</option>
              <option value="JOIN_DATE_OLD">Oldest Joiner</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50">
            <tr className="text-[10px] uppercase font-black text-gray-400 tracking-widest border-b border-gray-50">
              <th className="px-10 py-5">Volunteer Info</th>
              <th className="px-10 py-5">Assigned Roles</th>
              <th className="px-10 py-5">Join Date</th>
              <th className="px-10 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {processedVolunteers.map(v => (
              <tr key={v.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-10 py-6">
                  <div className="flex items-center space-x-4">
                    <img src={`https://picsum.photos/seed/${v.id}/40/40`} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="" />
                    <div>
                      <p className="font-bold text-gray-900">{v.fullName}</p>
                      <p className="text-xs text-gray-400 font-medium">@{v.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-6">
                  <div className="flex flex-wrap gap-1.5">
                    {v.roleIds.length === 0 ? (
                      <span className="text-[10px] text-gray-300 italic font-bold">No Roles Assigned</span>
                    ) : (
                      v.roleIds.map(rid => (
                        <span key={rid} className="px-2 py-1 bg-white border border-gray-100 rounded-lg text-[10px] font-black text-gray-500 uppercase tracking-tight">
                          {roles.find(r => r.id === rid)?.name}
                        </span>
                      ))
                    )}
                  </div>
                </td>
                <td className="px-10 py-6">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{new Date(v.joinedAt).toLocaleDateString()}</p>
                </td>
                <td className="px-10 py-6">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onViewAs(v.id)} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-black uppercase text-[10px] hover:bg-blue-600 hover:text-white transition-all shadow-sm">View As</button>
                    <button onClick={() => setEditingId(v.id)} className="px-4 py-2 bg-gray-50 text-gray-600 rounded-xl font-black uppercase text-[10px] hover:bg-gray-200 transition-all shadow-sm">Edit Roles</button>
                    <button onClick={() => setResettingId(v.id)} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-black uppercase text-[10px] hover:bg-red-600 hover:text-white transition-all shadow-sm">Reset</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative">
            <h3 className="text-2xl font-black text-gray-900 mb-2">Adjust Roles</h3>
            <p className="text-sm text-gray-500 mb-8">Update assignments for {volunteers.find(v => v.id === editingId)?.fullName}.</p>
            <div className="space-y-2 mb-8 max-h-80 overflow-y-auto pr-2 scrollbar-hide">
              {roles.map(r => {
                const isSelected = volunteers.find(curr => curr.id === editingId)?.roleIds.includes(r.id);
                return (
                  <button key={r.id} onClick={() => handleToggleRole(r.id)} className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-gray-50 border-transparent hover:border-blue-100'}`}>
                    <div>
                      <p className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-gray-900'}`}>{r.name}</p>
                      <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>{departments.find(d => d.id === r.departmentId)?.name}</p>
                    </div>
                    {isSelected && <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setEditingId(null)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl">Done</button>
          </div>
        </div>
      )}

      {resettingId && resettingVolunteer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-xl shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="mb-8">
              <h3 className="text-2xl font-black text-gray-900 mb-2">Reset Training Progress</h3>
              <p className="text-sm text-gray-500">Manage completed chapters for <span className="font-bold text-gray-900">{resettingVolunteer.fullName}</span>.</p>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-8 scrollbar-hide">
              {assignedModulesForReset.length === 0 ? (
                <div className="p-10 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  <p className="text-xs text-gray-400 font-bold uppercase italic">No modules assigned yet.</p>
                </div>
              ) : (
                assignedModulesForReset.map(m => {
                  const moduleChapters = m.chapters.map(c => c.id);
                  const completedInModule = resettingVolunteer.completedChapterIds.filter(id => moduleChapters.includes(id)).length;
                  return (
                    <div key={m.id} className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm flex items-center justify-between group">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${m.isCompulsory ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>{m.isCompulsory ? 'Foundational' : 'Specialized'}</span>
                          <span className="text-xs font-bold text-gray-900">{m.title}</span>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{completedInModule} / {m.chapters.length} Chapters Completed</p>
                      </div>
                      <button disabled={completedInModule === 0} onClick={() => onResetProgress(resettingVolunteer.id, m.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${completedInModule > 0 ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}`}>Reset Module</button>
                    </div>
                  );
                })
              )}
            </div>
            <div className="pt-8 border-t border-gray-100 grid grid-cols-2 gap-4">
              <button onClick={() => { if (confirm(`Completely wipe ALL progress for ${resettingVolunteer.fullName}?`)) onResetProgress(resettingVolunteer.id); }} className="bg-red-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-700 transition-all shadow-lg shadow-red-100">Reset All Progress</button>
              <button onClick={() => setResettingId(null)} className="bg-gray-100 text-gray-600 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerList;