import React, { useState } from 'react';
import { Notification, Volunteer } from '../types';

interface HeaderProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  currentUser: Volunteer | null;
  volunteers: Volunteer[];
  onImpersonate: (id: string | null) => void;
  impersonatedId: string | null;
}

const Header: React.FC<HeaderProps> = ({ 
  notifications, 
  onMarkRead, 
  currentUser, 
  volunteers, 
  onImpersonate,
  impersonatedId 
}) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-gray-800 hidden lg:block">Journey LMS</h1>
        
        {currentUser?.isAdmin && (
            <div className="relative group/persona">
                <button 
                    onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${impersonatedId ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    <span>{impersonatedId ? 'Switch Persona' : 'View As...'}</span>
                </button>
                <span className="absolute top-full mt-2 left-0 hidden group-hover/persona:block bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 shadow-xl">
                  Simulate the dashboard of any volunteer
                </span>

                {showPersonaMenu && (
                    <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden ring-1 ring-black ring-opacity-5">
                        <div className="p-3 bg-gray-50 border-b border-gray-100">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Persona</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto py-1">
                            <button 
                                onClick={() => { onImpersonate(null); setShowPersonaMenu(false); }}
                                className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-blue-50 transition-colors ${!impersonatedId ? 'text-blue-600 bg-blue-50/50' : 'text-gray-700'}`}
                            >
                                Default (Me)
                            </button>
                            {volunteers.filter(v => v.id !== currentUser?.id).map(v => (
                                <button 
                                    key={v.id}
                                    onClick={() => { onImpersonate(v.id); setShowPersonaMenu(false); }}
                                    className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-blue-50 transition-colors ${impersonatedId === v.id ? 'text-blue-600 bg-blue-50/50' : 'text-gray-700'}`}
                                >
                                    {v.fullName} (@{v.username})
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="relative group/notif">
          <button 
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2 rounded-full hover:bg-gray-100 relative transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-bold">
                {notifications.length}
              </span>
            )}
          </button>
          {!showNotifs && (
            <span className="absolute top-full mt-2 right-0 hidden group-hover/notif:block bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 shadow-xl">
              View your alerts and completion notices
            </span>
          )}

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden ring-1 ring-black ring-opacity-5">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <span className="font-bold text-gray-700">Notifications</span>
                <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">Clear All</span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <p className="text-sm">All caught up!</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 flex items-start space-x-3 transition-colors">
                      <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${n.type === 'NEW_MODULE' ? 'bg-blue-500' : n.type === 'COMPLETION' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 leading-tight">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{n.timestamp.toLocaleTimeString()}</p>
                        <button 
                          onClick={() => onMarkRead(n.id)}
                          className="mt-2 text-[10px] font-semibold text-blue-600 uppercase tracking-wider hover:underline"
                        >
                          Mark as read
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3 pl-4 border-l border-gray-200 group/profile relative">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-800">{currentUser?.fullName}</p>
            <p className="text-xs text-gray-500 capitalize">{currentUser?.isAdmin ? 'Administrator' : 'Volunteer'}</p>
          </div>
          <img 
            src={`https://picsum.photos/seed/${currentUser?.id}/40/40`} 
            alt="Profile" 
            className="w-10 h-10 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-100"
          />
          <span className="absolute top-full mt-2 right-0 hidden group-hover/profile:block bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 shadow-xl">
            Account settings and profile
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;