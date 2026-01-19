
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
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file.' });
      return;
    }

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 2MB.' });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const fileExt = file.name.split('.').pop();
      // Use user ID as the folder name to match the RLS policy: bucket/uid/timestamp.ext
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`;

      // 1. Upload to Supabase Storage ('avatars' is the bucket name)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) {
        if (uploadError.message === 'Bucket not found') {
          throw new Error('Storage bucket "avatars" does not exist. Please ask an Admin to run the "V5 SQL Script" from the top banner to initialize storage.');
        }
        throw uploadError;
      }

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);
      setMessage({ type: 'success', text: 'Photo uploaded! Click "Update Profile" below to finalize changes.' });
    } catch (err: any) {
      console.error('Upload error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to upload photo.' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      // 1. Update metadata in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
          avatar_url: avatarUrl
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // 2. Handle sensitive Auth updates
      if (email !== profile.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) throw emailError;
        setMessage({ type: 'success', text: 'Email update pending. Confirm the change via the email sent to you.' });
      }

      if (isChangingPassword) {
        if (newPassword !== confirmPassword) throw new Error("Passwords do not match.");
        if (newPassword.length < 6) throw new Error("Password must be at least 6 characters.");
        const { error: pwdError } = await supabase.auth.updateUser({ password: newPassword });
        if (pwdError) throw pwdError;
      }

      onUpdate({
        ...profile,
        full_name: fullName,
        email: email,
        phone: phone,
        avatar_url: avatarUrl
      });

      if (!message) setMessage({ type: 'success', text: 'Profile successfully updated!' });
      
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An error occurred while saving.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white/20">
        <div className="p-10 border-b border-gray-50 flex justify-between items-start bg-gray-50/50">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Edit Profile</h2>
            <p className="text-sm text-gray-500 mt-1">Update your info and profile picture.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-2xl transition-all">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
          {message && (
            <div className={`p-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest animate-fadeIn ${message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="col-span-full flex flex-col items-center space-y-4 mb-4">
              <div 
                className="relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-32 h-32 rounded-[2.5rem] bg-blue-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center text-blue-600 font-black text-4xl ring-1 ring-gray-100 transition-transform group-hover:scale-105 duration-300">
                   {avatarUrl ? (
                     <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                   ) : (
                     fullName.charAt(0) || 'U'
                   )}
                   {isUploading && (
                     <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                     </div>
                   )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <input 
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Click to upload photo</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                <input required type="text" className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-bold" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email</label>
                <input required type="email" className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-bold" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                <input type="tel" className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-bold" value={phone} onChange={e => setPhone(e.target.value)} placeholder="555-0101" />
              </div>

              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Settings</h4>
                  <button type="button" onClick={() => setIsChangingPassword(!isChangingPassword)} className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest">
                    {isChangingPassword ? 'Cancel Change' : 'Change Password'}
                  </button>
                </div>
                
                {isChangingPassword && (
                  <div className="space-y-4 animate-slideDown">
                    <div>
                      <label className="block text-[9px] font-black text-gray-400 uppercase mb-1 ml-1">New Password</label>
                      <input type="password" placeholder="••••••••" className="w-full bg-white border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 text-sm font-bold" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-gray-400 uppercase mb-1 ml-1">Confirm New Password</label>
                      <input type="password" placeholder="••••••••" className="w-full bg-white border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 text-sm font-bold" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100 flex gap-4">
            <button 
              disabled={isSaving || isUploading}
              type="submit" 
              className="flex-1 bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-blue-100 hover:bg-blue-700 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {isSaving ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditor;
