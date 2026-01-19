
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
  const volunteerData = useMemo(() => 
    volunteers.find(v => v.id === profile?.id || v.email === profile?.email),
  [volunteers, profile]);

  const assignedModules = useMemo(() => {
    if (!volunteerData) return [];
    const assignedIds = new Set<string>();
    modules.filter(m => m.isCompulsory).forEach(m => assignedIds.add(m.id));
    volunteerData.roleIds.forEach(roleId => {
      const role = roles.find(r => r.id === roleId);
      if (role) {
        const dept = departments.find(d => d.id === role.departmentId);
        if (dept) dept.coreModuleIds.forEach(id => assignedIds.add(id));
        const journey = journeys.find(j => j.roleId === roleId);
        if (journey) journey.progressionModuleIds.forEach(id => assignedIds.add(id));
      }
    });
    return modules.filter(m => assignedIds.has(m.id));
  }, [volunteerData, modules, roles, departments, journeys]);

  const moduleProgress = useMemo(() => {
    return assignedModules.map(module => {
      const totalChapters = module.chapters.length;
      if (totalChapters === 0) return { ...module, progressPercent: 100 };
      const completedCount = module.chapters.filter(chapter => 
        volunteerData?.completedChapterIds.includes(chapter.id)
      ).length;
      const progressPercent = Math.round((completedCount / totalChapters) * 100);
      return { ...module, progressPercent };
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
    <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12 pb-20 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 mb-3 sm:mb-4">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-blue-600">Learning Path Active</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-gray-900 leading-tight sm:leading-none">
            Welcome, <span className="text-blue-600">{profile?.full_name?.split(' ')[0]}</span>.
          </h2>
          <p className="text-sm sm:text-base text-gray-500 font-medium mt-1 sm:mt-2">Track your growth for ministry excellence.</p>
        </div>

        <div className="flex items-center space-x-4 bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm w-full sm:w-auto">
           <div className="text-right flex-1 sm:flex-initial">
              <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">Completion</p>
              <p className="text-lg sm:text-xl font-black text-gray-900">{overallStats.percent}%</p>
           </div>
           <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xs sm:text-sm shrink-0">
             {overallStats.completed}/{overallStats.total}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {moduleProgress.length === 0 ? (
          <div className="col-span-full py-16 sm:py-20 bg-white rounded-[1.5rem] sm:rounded-[3rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center p-6">
            <h3 className="text-xl sm:text-2xl font-black text-gray-800">No Assignments Yet</h3>
            <p className="text-sm text-gray-400 max-w-xs mt-2">Check back soon for assigned ministry training paths!</p>
          </div>
        ) : (
          moduleProgress.map((module) => (
            <div key={module.id} className="bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${module.isCompulsory ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    {module.isCompulsory ? 'Core' : 'Specialized'}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase">{module.durationMinutes}m</span>
                </div>
                <h4 className="font-bold text-lg sm:text-xl text-gray-900 mb-2">{module.title}</h4>
                <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8 line-clamp-2 leading-relaxed">{module.description}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-blue-600">{module.progressPercent}%</span>
                  </div>
                  <div className="h-1.5 sm:h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                    <div className={`h-full transition-all duration-1000 ${module.progressPercent === 100 ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${module.progressPercent}%` }} />
                  </div>
                </div>
              </div>
              <button className={`w-full mt-6 sm:mt-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] transition-all ${
                module.progressPercent === 100 ? 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white' : 'bg-gray-50 text-gray-600 hover:bg-blue-600 hover:text-white'
              }`}>
                {module.progressPercent === 100 ? 'Review' : 'Continue Training'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
