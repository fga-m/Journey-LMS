
import React, { useState, useRef, useEffect } from 'react';
import { Profile } from '../types.ts';
import ProfileEditor from './ProfileEditor.tsx';

interface HeaderProps {
  profile: Profile | null;
  onProfileUpdate: (updated: Profile) => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ profile, onProfileUpdate, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-black text-gray-900 tracking-tight">Journey Portal</h1>
      </div>
      
      <div className="flex items-center space-x-6 relative" ref={menuRef}>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center space-x-3 pl-4 border-l border-gray-200 group focus:outline-none"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors">{profile?.full_name}</p>
            <p className="text-[10px] text-blue-500 uppercase font-black tracking-widest">{profile?.role}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm ring-1 ring-gray-100 flex items-center justify-center text-blue-600 font-black overflow-hidden hover:scale-105 transition-transform duration-200">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
            ) : (
              profile?.full_name?.charAt(0) || 'U'
            )}
          </div>
        </button>

        {isMenuOpen && (
          <div className="absolute top-full right-0 mt-3 w-56 bg-white border border-gray-100 rounded-3xl shadow-2xl overflow-hidden animate-slideUp z-50 ring-1 ring-black/5">
            <div className="p-4 border-b border-gray-50 bg-gray-50/50">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">User Settings</p>
               <p className="text-xs font-bold text-gray-900 truncate">{profile?.email}</p>
            </div>
            <div className="p-2">
              <button 
                onClick={() => { setIsEditorOpen(true); setIsMenuOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-all flex items-center space-x-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <span className="text-sm font-bold">Edit Profile</span>
              </button>
              <button 
                onClick={onLogout}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 text-gray-700 hover:text-red-600 transition-all flex items-center space-x-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                <span className="text-sm font-bold">Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {isEditorOpen && profile && (
        <ProfileEditor 
          profile={profile} 
          onClose={() => setIsEditorOpen(false)} 
          onUpdate={onProfileUpdate} 
        />
      )}
    </header>
  );
};

export default Header;
