
import React from 'react';
import { Profile } from '../types.ts';

interface HeaderProps {
  profile: Profile | null;
}

const Header: React.FC<HeaderProps> = ({ profile }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-gray-800">Journey Portal</h1>
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-gray-900 tracking-tight">{profile?.full_name}</p>
            <p className="text-[10px] text-blue-500 uppercase font-black tracking-widest">{profile?.role}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm ring-1 ring-gray-100 flex items-center justify-center text-blue-600 font-black">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
