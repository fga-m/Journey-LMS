
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

  const editingVolunteer = useMemo(() => volunteers.find(v => v.id === editingId) || null, [volunteers, editingId]);

  useEffect(() => {
    if (editingVolunteer) {
      setEditUsername(editingVolunteer.username);
      setEditRoleIds(editingVolunteer.roleIds);
      setEditIsAdmin(editingVolunteer.isAdmin);
      setEditError(null);
    }
  }, [editingVolunteer]);

  const handleSaveEdit = async () => {
    if (!editingVolunteer) return;
    setIsSaving(true);
    setEditError(null);
    try {
      await onUpdateVolunteer({ ...editingVolunteer, username: editUsername.toLowerCase().trim(), roleIds: editRoleIds, isAdmin: editIsAdmin });
      setEditingId(null);
    } catch (err: any) {
      setEditError(err.message || "Failed to update volunteer.");
    } finally { setIsSaving(false); }
  };

  return (
    <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden text-gray-900 animate-fadeIn">
      <div className="p-6 sm:p-10 border-b border-gray-50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-gray-50/30">
        <div className="flex-1 flex items-center space-x-4 w-full">
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">Directory</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage ministry roles and training.</p>
          </div>
          <button onClick={onRefresh} className={`p-2 rounded-xl text-gray-400 hover:text-blue-600 transition-all ${isRefreshing ? 'animate-spin' : ''}`}>
            <svg className="w-5 h-5 sm:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <input type="text" placeholder="Search..." className="flex-1 sm:w-64 bg-white border-2 border-gray-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-semibold shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="bg-white border-2 border-gray-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl outline-none focus:border-blue-500 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm cursor-pointer">
            <option value="NAME_ASC">Name (A-Z)</option>
            <option value="NAME_DESC">Name (Z-A)</option>
            <option value="JOIN_DATE_NEW">Newest Joiner</option>
          </select>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden p-4 space-y-4">
        {processedVolunteers.map(v => (
          <div key={v.id} className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full border-2 border-white shadow-sm bg-blue-100 flex items-center justify-center text-blue-600 font-black text-sm overflow-hidden shrink-0">
                {v.avatarUrl ? <img src={v.avatarUrl} alt={v.fullName} className="w-full h-full object-cover" /> : v.fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="font-bold text-gray-900 truncate">{v.fullName}</p>
                  {v.isAdmin && <span className="text-[8px] bg-blue-600 text-white px-1 py-0.5 rounded font-black uppercase">Admin</span>}
                </div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest truncate">@{v.username}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 border-t border-gray-50 pt-4">
              {v.roleIds.map(rid => (
                <span key={rid} className="px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[9px] font-black text-gray-500 uppercase tracking-tight">{roles.find(r => r.id === rid)?.name}</span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button onClick={() => onViewAs(v.id)} className="py-2 bg-blue-50 text-blue-600 rounded-lg font-black uppercase text-[9px] transition-all">View</button>
              <button onClick={() => setEditingId(v.id)} className="py-2 bg-gray-50 text-gray-600 rounded-lg font-black uppercase text-[9px] transition-all">Edit</button>
              <button onClick={() => setResettingId(v.id)} className="py-2 bg-red-50 text-red-600 rounded-lg font-black uppercase text-[9px] transition-all">Reset</button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50">
            <tr className="text-[10px] uppercase font-black text-gray-400 tracking-widest border-b border-gray-50">
              <th className="px-10 py-5">Volunteer Info</th>
              <th className="px-10 py-5">Assigned Roles</th>
              <th className="px-10 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {processedVolunteers.map(v => (
              <tr key={v.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-10 py-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-blue-100 flex items-center justify-center text-blue-600 font-black text-sm overflow-hidden shrink-0">
                      {v.avatarUrl ? <img src={v.avatarUrl} alt={v.fullName} className="w-full h-full object-cover" /> : v.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-bold text-gray-900">{v.fullName}</p>
                        {v.isAdmin && <span className="text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-black uppercase">Admin</span>}
                      </div>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">@{v.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-6">
                  <div className="flex flex-wrap gap-1.5">
                    {v.roleIds.map(rid => (
                      <span key={rid} className="px-2 py-1 bg-white border border-gray-100 rounded-lg text-[10px] font-black text-gray-500 uppercase tracking-tight">{roles.find(r => r.id === rid)?.name}</span>
                    ))}
                  </div>
                </td>
                <td className="px-10 py-6">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onViewAs(v.id)} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-black uppercase text-[10px] hover:bg-blue-600 transition-all">View</button>
                    <button onClick={() => setEditingId(v.id)} className="px-4 py-2 bg-gray-50 text-gray-600 rounded-xl font-black uppercase text-[10px] hover:bg-gray-200 transition-all">Edit</button>
                    <button onClick={() => setResettingId(v.id)} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-black uppercase text-[10px] hover:bg-red-600 transition-all">Reset</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingId && editingVolunteer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
          <div className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] w-full max-w-lg shadow-2xl relative max-h-[95vh] flex flex-col">
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">Edit Volunteer</h3>
            <div className="flex-1 overflow-y-auto pr-1 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Username</label>
                <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-sm font-semibold" value={editUsername} onChange={e => setEditUsername(e.target.value.toLowerCase())} />
              </div>
              <div className="p-4 sm:p-6 bg-slate-50 rounded-2xl sm:rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-700">Admin Mode</p>
                  <button onClick={() => setEditIsAdmin(!editIsAdmin)} className={`w-10 h-5 rounded-full relative transition-all ${editIsAdmin ? 'bg-blue-600' : 'bg-slate-300'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${editIsAdmin ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Role Assignments</p>
                {roles.map(r => (
                  <button key={r.id} onClick={() => setEditRoleIds(prev => prev.includes(r.id) ? prev.filter(i => i !== r.id) : [...prev, r.id])} className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center justify-between ${editRoleIds.includes(r.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-transparent'}`}>
                    <span className="text-xs font-bold">{r.name}</span>
                    {editRoleIds.includes(r.id) && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-gray-100">
              <button disabled={isSaving} onClick={handleSaveEdit} className="bg-slate-900 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase text-[10px]">Save</button>
              <button onClick={() => setEditingId(null)} className="bg-gray-100 text-gray-600 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase text-[10px]">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerList;
