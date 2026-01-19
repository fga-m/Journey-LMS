
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase.ts';
import { Profile, Enrollment } from '../types.ts';

interface DashboardProps {
  profile: Profile | null;
}

const Dashboard: React.FC<DashboardProps> = ({ profile }) => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) fetchEnrollments();
  }, [profile]);

  const fetchEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses (*)
        `)
        .eq('profile_id', profile?.id);
      
      if (error) throw error;
      setEnrollments(data || []);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="p-10 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
      Loading your training path...
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 px-4 animate-fadeIn">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-gray-900">Volunteer Dashboard</h2>
          <p className="text-gray-500 font-medium">Welcome back, {profile?.full_name}. Here is your current progress.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {enrollments.length === 0 ? (
          <div className="col-span-full py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <h3 className="text-2xl font-black text-gray-800">No Enrolled Courses</h3>
            <p className="text-gray-400 max-w-xs mt-2">Visit the Library to discover training paths assigned to your ministry role.</p>
          </div>
        ) : (
          enrollments.map((en) => (
            <div key={en.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Course Path
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{en.course?.duration_minutes} min</span>
                </div>
                <h4 className="font-bold text-xl text-gray-900 mb-2">{en.course?.title}</h4>
                <p className="text-sm text-gray-500 mb-8 line-clamp-2 leading-relaxed">{en.course?.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-blue-600">{en.progress_percent}%</span>
                  </div>
                  <div className="h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-1000" 
                      style={{ width: `${en.progress_percent}%` }}
                    />
                  </div>
                </div>
              </div>
              <button className="w-full mt-8 py-4 bg-gray-50 text-gray-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 hover:text-white transition-all">
                {en.progress_percent > 0 ? 'Resume Course' : 'Start Learning'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
