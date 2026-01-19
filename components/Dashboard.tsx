
import React, { useMemo } from 'react';
import { Profile, Volunteer, TrainingModule, Role, Department, Journey } from '../types.ts';

interface DashboardProps {
  profile: Profile | null;
  volunteers: Volunteer[];
  modules: TrainingModule[];
  roles: Role[];
  departments: Department[];
  journeys: Journey[];
}

const Dashboard: React.FC<DashboardProps> = ({ profile, volunteers, modules, roles, departments, journeys }) => {
  // Find the active volunteer data
  const volunteerData = useMemo(() => 
    volunteers.find(v => v.id === profile?.id || v.email === profile?.email),
  [volunteers, profile]);

  // Derive the assigned modules for this volunteer
  const assignedModules = useMemo(() => {
    if (!volunteerData) return [];

    const assignedIds = new Set<string>();

    // 1. Global Compulsory
    modules.filter(m => m.isCompulsory).forEach(m => assignedIds.add(m.id));

    // 2. Department & Role specific
    volunteerData.roleIds.forEach(roleId => {
      const role = roles.find(r => r.id === roleId);
      if (role) {
        // Department Core
        const dept = departments.find(d => d.id === role.departmentId);
        if (dept) dept.coreModuleIds.forEach(id => assignedIds.add(id));
        
        // Role Journey Progression
        const journey = journeys.find(j => j.roleId === roleId);
        if (journey) journey.progressionModuleIds.forEach(id => assignedIds.add(id));
      }
    });

    return modules.filter(m => assignedIds.has(m.id));
  }, [volunteerData, modules, roles, departments, journeys]);

  // Calculate progress for each assigned module
  const moduleProgress = useMemo(() => {
    return assignedModules.map(module => {
      const totalChapters = module.chapters.length;
      if (totalChapters === 0) return { ...module, progressPercent: 100 };
      
      const completedCount = module.chapters.filter(chapter => 
        volunteerData?.completedChapterIds.includes(chapter.id)
      ).length;
      
      const progressPercent = Math.round((completedCount / totalChapters) * 100);
      
      return {
        ...module,
        progressPercent
      };
    });
  }, [assignedModules, volunteerData]);

  const overallStats = useMemo(() => {
    if (moduleProgress.length === 0) return { completed: 0, total: 0, percent: 0 };
    const completedCount = moduleProgress.filter(m => m.progressPercent === 100).length;
    return {
      completed: completedCount,
      total: moduleProgress.length,
      percent: Math.round((completedCount / moduleProgress.length) * 100)
    };
  }, [moduleProgress]);

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 px-4 animate-fadeIn">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 mb-4">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Active Learning Journey</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-gray-900 leading-none">
            Welcome, <span className="text-blue-600">{profile?.full_name?.split(' ')[0]}</span>.
          </h2>
          <p className="text-gray-500 font-medium mt-2">Track your growth and preparation for ministry excellence.</p>
        </div>

        <div className="flex items-center space-x-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
           <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Overall Completion</p>
              <p className="text-xl font-black text-gray-900">{overallStats.percent}%</p>
           </div>
           <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-sm">
             {overallStats.completed}/{overallStats.total}
           </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {moduleProgress.length === 0 ? (
          <div className="col-span-full py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-gray-800">No Assignments Yet</h3>
            <p className="text-gray-400 max-w-xs mt-2">An administrator hasn't assigned any training paths to your role yet. Check back soon!</p>
          </div>
        ) : (
          moduleProgress.map((module) => (
            <div key={module.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${module.isCompulsory ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    {module.isCompulsory ? 'Foundational' : 'Specialized'}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{module.durationMinutes} min</span>
                </div>
                <h4 className="font-bold text-xl text-gray-900 mb-2">{module.title}</h4>
                <p className="text-sm text-gray-500 mb-8 line-clamp-2 leading-relaxed">{module.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-gray-400">Path Progress</span>
                    <span className="text-blue-600">{module.progressPercent}%</span>
                  </div>
                  <div className="h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                    <div 
                      className={`h-full transition-all duration-1000 ${module.progressPercent === 100 ? 'bg-green-500' : 'bg-blue-600'}`}
                      style={{ width: `${module.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <button className={`w-full mt-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${
                module.progressPercent === 100 
                  ? 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white' 
                  : 'bg-gray-50 text-gray-600 hover:bg-blue-600 hover:text-white'
              }`}>
                {module.progressPercent === 100 ? 'Review Module' : (module.progressPercent > 0 ? 'Resume Training' : 'Start Path')}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
