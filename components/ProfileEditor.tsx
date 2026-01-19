
import React, { useState, useRef } from 'react';
import { Profile } from '../types.ts';
import { supabase } from '../supabase.ts';

interface ProfileEditorProps {
  profile: Profile;
  onClose: () => void;
  onUpdate: (updated: Profile) => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ profile, onClose, onUpdate }) => {
  const [fullName, setFullName] = useState(profile.full_name);
  const [username, setUsername] = useState(profile.username || '');
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone || '');
  
  // Security state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file.' });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // 1. Upload to Storage (assuming bucket 'avatars' exists and is public)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message.includes('bucket not found')) {
          throw new Error('Avatar storage is not configured. Please contact admin to create an "avatars" bucket.');
        }
        throw uploadError;
      }

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update Profile Table immediately for the avatar
      const { error: profileError } = await supabase.from('profiles').update({ 
        avatar_url: publicUrl 
      }).eq('id', profile.id);

      if (profileError) throw profileError;

      // 4. Trigger state update
      const updatedProfile = { ...profile, avatar_url: publicUrl };
      onUpdate(updatedProfile);
      setMessage({ type: 'success', text: 'Profile picture updated!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setIsSaving(true);
    try {
      const authUpdates: any = {};
      if (email !== profile.email) authUpdates.email = email;
      if (newPassword) authUpdates.password = newPassword;

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(authUpdates);
        if (authError) throw authError;
        if (authUpdates.email) {
          setMessage({ type: 'success', text: 'Identity updated! Please check your new email to confirm the change.' });
        }
      }

      const { error: profileError } = await supabase.from('profiles').update({ 
        full_name: fullName, 
        username: username.toLowerCase().trim(),
        phone: phone
      }).eq('id', profile.id);

      if (profileError) throw profileError;

      onUpdate({ 
        ...profile, 
        full_name: fullName, 
        username: username.toLowerCase().trim(),
        email: email, 
        phone: phone
      });

      if (!message) setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      if (!authUpdates.email) {
        setTimeout(onClose, 1500);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally { 
      setIsSaving(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] sm:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 sm:p-10 border-b border-gray-50 flex justify-between items-start bg-gray-50/50 shrink-0">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Account Settings</h2>
            <p className="text-xs sm:text-sm text-gray-500">Manage your identity and security.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-10 scrollbar-hide pb-20">
          {message && (
            <div className={`p-4 rounded-2xl text-xs font-black uppercase tracking-widest animate-slideUp ${
              message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
            }`}>
              {message.text}
            </div>
          )}

          {/* Interactive Avatar Upload */}
          <div className="flex flex-col items-center space-y-6">
            <div className="relative group">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileSelect} 
              />
              
              <button 
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="relative w-32 h-32 rounded-[2.5rem] bg-blue-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center text-blue-600 font-black text-4xl group transition-transform hover:scale-105 active:scale-95 disabled:scale-100"
              >
                {isUploading && (
                  <div className="absolute inset-0 bg-blue-600/60 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                   </svg>
                </div>

                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  fullName.charAt(0)
                )}
              </button>
            </div>
            
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
            >
              {isUploading ? 'Uploading...' : 'Change Photo'}
            </button>
          </div>

          {/* Identity Section */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-blue-50 pb-2">Public Identity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                <input 
                  required 
                  type="text" 
                  className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none transition-all" 
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border-2 border-gray-100 p-4 pl-8 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none transition-all" 
                    value={username} 
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-blue-50 pb-2">Contact Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                <input 
                  required 
                  type="email" 
                  className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none transition-all" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                <input 
                  type="tel" 
                  className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none transition-all" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                />
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-red-600 uppercase tracking-widest border-b border-red-50 pb-2">Security</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                <input 
                  type="password" 
                  placeholder="Leave blank to keep current"
                  className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none transition-all" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                <input 
                  type="password" 
                  className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none transition-all" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                />
              </div>
            </div>
          </div>
        </form>

        {/* Action Footer */}
        <div className="p-6 sm:p-10 border-t border-gray-100 bg-white shrink-0">
          <button 
            type="submit" 
            onClick={handleSave} 
            disabled={isSaving || isUploading} 
            className="w-full bg-blue-600 text-white py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-100 hover:bg-blue-700 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0"
          >
            {isSaving ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Synchronizing...</span>
              </div>
            ) : (
              'Save All Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;
