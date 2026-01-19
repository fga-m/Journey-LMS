
import React, { useState, useRef } from 'react';
import { Profile } from '../types.ts';
import { supabase } from '../supabase.ts';

interface ProfileEditorProps {
  profile: Profile;
  onClose: () => void;
  onUpdate: (updated: Profile) => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ profile, onClose, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(profile.full_name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ full_name: fullName, phone: phone, avatar_url: avatarUrl }).eq('id', profile.id);
      if (error) throw error;
      onUpdate({ ...profile, full_name: fullName, email: email, phone: phone, avatar_url: avatarUrl });
      setMessage({ type: 'success', text: 'Profile updated!' });
      setTimeout(onClose, 1000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally { setIsSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] sm:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
        <div className="p-6 sm:p-10 border-b border-gray-50 flex justify-between items-start bg-gray-50/50 shrink-0">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Edit Profile</h2>
            <p className="text-xs sm:text-sm text-gray-500">Update your identity in the portal.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all"><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 sm:space-y-8 scrollbar-hide">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-24 h-24 rounded-[2rem] bg-blue-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center text-blue-600 font-black text-3xl">
              {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : fullName.charAt(0)}
            </div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Avatar Syncing Enabled</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
              <input required type="text" className="w-full bg-gray-50 border-2 border-gray-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-sm font-bold" value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone</label>
              <input type="tel" className="w-full bg-gray-50 border-2 border-gray-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-sm font-bold" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </div>
        </form>
        <div className="p-6 sm:p-10 border-t border-gray-100 shrink-0">
          <button type="submit" onClick={handleSave} disabled={isSaving} className="w-full bg-blue-600 text-white py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-blue-700 transition-all disabled:opacity-50">
            {isSaving ? 'Saving...' : 'Update Identity'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;
