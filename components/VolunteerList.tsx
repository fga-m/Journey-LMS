
import React, { useState, useMemo, useEffect } from 'react';
import { Volunteer, Role, TrainingModule, Department, Journey } from '../types.ts';

interface VolunteerListProps {
  volunteers: Volunteer[];
  setVolunteers: React.Dispatch<React.SetStateAction<Volunteer[]>>;
  modules: TrainingModule[];
  roles: Role[];
  departments: Department[];
  journeys: Journey[];
  onUpdateVolunteer: (v: Volunteer) => Promise<void>;
  onResetProgress: (volunteerId: string, moduleId?: string) => void;
  onViewAs: (id: string) => void;
  onRefresh?: () => void;
}

type SortOption = 'NAME_ASC' | 'NAME_DESC' | 'USERNAME' | 'JOIN_DATE_NEW' | 'JOIN_DATE_OLD';

const VolunteerList: React.FC<VolunteerListProps> = ({ volunteers, modules, roles, departments, journeys, onUpdateVolunteer, onResetProgress, onViewAs, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('NAME_ASC');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Modal specific state for the current editing session
  const [editUsername, setEditUsername] = useState('');
  const [editRoleIds, setEditRoleIds] = useState<string[]>([]);
  const [editIsAdmin, setEditIsAdmin] = useState(false);

  const processedVolunteers = useMemo(() => {
    let result = volunteers.filter(v => 
      v.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      v.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.email.toLowerCase().includes(searchTerm.toLowerCase())
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

  const editingVolunteer = useMemo(() => 
    volunteers.find(v => v.id === editingId) || null, 
  [volunteers, editingId]);

  useEffect(() => {
    if (editingVolunteer) {
      setEditUsername(editingVolunteer.username);
      setEditRoleIds(editingVolunteer.roleIds);
      setEditIsAdmin(editingVolunteer.isAdmin);
      setEditError(null);
    }
  }, [editingVolunteer]);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleToggleRole = (rid: string) => {
    setEditRoleIds(prev => 
      prev.includes(rid) ? prev.filter(id => id !== rid) : [...prev, rid]
    );
  };

  const handleSaveEdit = async () => {
    if (!editingVolunteer) return;
    
    // Check local uniqueness first to avoid round-trip
    const usernameTaken = volunteers.some(v => 
      v.id !== editingVolunteer.id && 
      v.username.toLowerCase() === editUsername.toLowerCase().trim()
    );

    if (usernameTaken) {
      setEditError(`The username "${editUsername}" is already in use by another volunteer.`);
      return;
    }

    setIsSaving(true);
    setEditError(null);
    try {
      await onUpdateVolunteer({
        ...editingVolunteer,
        username: editUsername.toLowerCase().trim(),
        roleIds: editRoleIds,
        isAdmin: editIsAdmin
      });
      setEditingId(null);
    } catch (err: any) {
      setEditError(err.message || "Failed to update volunteer.");
    } finally {
      setIsSaving(false);
    }
  };

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

  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden text-gray-900 animate-fadeIn">
      <div className="p-10 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gray-50/30">
        <div className="flex-1 flex items-center space-x-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-gray-900">Volunteer Directory</h2>
            <p className="text-sm text-gray-500 mt-1">Manage ministry roles and oversee training progression.</p>
          </div>
          <button onClick={handleRefresh} className={`p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-all ${isRefreshing ? 'animate-spin' : ''}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <input type="text" placeholder="Search..." className="w-full sm:w-64 bg-white border-2 border-gray-100 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-semibold shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="bg-white border-2 border-gray-100 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-xs font-black uppercase tracking-widest shadow-sm cursor-pointer">
            <option value="NAME_ASC">Name (A-Z)</option>
            <option value="NAME_DESC">Name (Z-A)</option>
            <option value="USERNAME">By Username</option>
            <option value="JOIN_DATE_NEW">Newest Joiner</option>
            <option value="JOIN_DATE_OLD">Oldest Joiner</option>
          </select>
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
                    <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-blue-100 flex items-center justify-center text-blue-600 font-black text-sm overflow-hidden shrink-0">
                      {v.avatarUrl ? (
                        <img src={v.avatarUrl} alt={v.fullName} className="w-full h-full object-cover" />
                      ) : (
                        v.fullName.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-bold text-gray-900">{v.fullName}</p>
                        {v.isAdmin && <span className="text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Admin</span>}
                      </div>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">@{v.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-6">
                  <div className="flex flex-wrap gap-1.5">
                    {v.roleIds.length === 0 ? <span className="text-[10px] text-gray-300 italic font-bold">No Roles</span> : v.roleIds.map(rid => (
                      <span key={rid} className="px-2 py-1 bg-white border border-gray-100 rounded-lg text-[10px] font-black text-gray-500 uppercase tracking-tight">{roles.find(r => r.id === rid)?.name}</span>
                    ))}
                  </div>
                </td>
                <td className="px-10 py-6 font-bold text-gray-400 text-[10px] uppercase tracking-wider">{new Date(v.joinedAt).toLocaleDateString()}</td>
                <td className="px-10 py-6">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onViewAs(v.id)} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-black uppercase text-[10px] hover:bg-blue-600 hover:text-white transition-all shadow-sm">View As</button>
                    <button onClick={() => setEditingId(v.id)} className="px-4 py-2 bg-gray-50 text-gray-600 rounded-xl font-black uppercase text-[10px] hover:bg-gray-200 transition-all shadow-sm">Edit</button>
                    <button onClick={() => setResettingId(v.id)} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-black uppercase text-[10px] hover:bg-red-600 hover:text-white transition-all shadow-sm">Reset</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingId && editingVolunteer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative">
            <h3 className="text-2xl font-black text-gray-900 mb-2">Edit Volunteer</h3>
            <p className="text-sm text-gray-500 mb-8">Update profile details and permissions for <span className="font-bold text-gray-900">{editingVolunteer.fullName}</span>.</p>
            
            {editError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest animate-pulse">
                Error: {editError}
              </div>
            )}

            <div className="space-y-6 mb-8 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
              <div className="flex flex-col items-center mb-4">
                <div className="w-24 h-24 rounded-[2rem] bg-blue-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-blue-600 font-black text-2xl ring-1 ring-gray-100">
                   {editingVolunteer.avatarUrl ? (
                     <img src={editingVolunteer.avatarUrl} alt={editingVolunteer.fullName} className="w-full h-full object-cover" />
                   ) : (
                     editingVolunteer.fullName.charAt(0)
                   )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Unique Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
                  <input 
                    type="text"
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 pl-9 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-semibold"
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    placeholder="username"
                  />
                </div>
                <p className="text-[9px] text-gray-400 mt-1 ml-1">Must be unique and contains only lowercase letters and numbers.</p>
              </div>

              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Access</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-700">Administrator Privileges</p>
                    <p className="text-[10px] text-slate-400">Can manage users, paths, and modules.</p>
                  </div>
                  <button onClick={() => setEditIsAdmin(!editIsAdmin)} className={`w-12 h-6 rounded-full transition-all relative ${editIsAdmin ? 'bg-blue-600' : 'bg-slate-300'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editIsAdmin ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ministry Role Assignments</h4>
              <div className="space-y-2">
                {roles.map(r => {
                  const isSelected = editRoleIds.includes(r.id);
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button disabled={isSaving} onClick={handleSaveEdit} className="bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50">
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button disabled={isSaving} onClick={() => setEditingId(null)} className="bg-gray-100 text-gray-600 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {resettingId && resettingVolunteer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-xl shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="mb-8"><h3 className="text-2xl font-black text-gray-900 mb-2">Reset Progress</h3><p className="text-sm text-gray-500">Manage completed chapters for <span className="font-bold text-gray-900">{resettingVolunteer.fullName}</span>.</p></div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-8 scrollbar-hide">
              {assignedModulesForReset.map(m => {
                const moduleChapters = m.chapters.map(c => c.id);
                const completedInModule = resettingVolunteer.completedChapterIds.filter(id => moduleChapters.includes(id)).length;
                return (
                  <div key={m.id} className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm flex items-center justify-between">
                    <div><p className="text-xs font-bold text-gray-900">{m.title}</p><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{completedInModule} / {m.chapters.length} Chapters</p></div>
                    <button disabled={completedInModule === 0} onClick={() => onResetProgress(resettingVolunteer.id, m.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${completedInModule > 0 ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}`}>Reset</button>
                  </div>
                );
              })}
            </div>
            <div className="pt-8 border-t border-gray-100 grid grid-cols-2 gap-4">
              <button onClick={() => { if (confirm(`Reset ALL progress?`)) onResetProgress(resettingVolunteer.id); }} className="bg-red-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-700 transition-all">Reset All</button>
              <button onClick={() => setResettingId(null)} className="bg-gray-100 text-gray-600 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerList;
