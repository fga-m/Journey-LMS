
import React from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
            </svg>
          </div>
          <span className="text-xl font-black tracking-tighter uppercase italic">Journey</span>
        </div>
        <div className="flex items-center space-x-8">
          <button onClick={onLogin} className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">Log In</button>
          <button onClick={onGetStarted} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-100">Get Started</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 text-center lg:text-left grid lg:grid-cols-2 gap-20 items-center">
        <div className="space-y-10 animate-slideUp">
          <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Empowering FGAM's Volunteers</span>
          </div>
          <h1 className="text-6xl lg:text-8xl font-black tracking-tight leading-none text-slate-900">
            FGA Melbourne's <span className="text-blue-600">Volunteer Journey.</span>
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed max-w-xl">
            A comprehensive training platform designed to equip church volunteers with the knowledge and heart to serve their community with excellence.
          </p>
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button onClick={onGetStarted} className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-3xl text-lg font-black uppercase tracking-widest shadow-2xl shadow-blue-100 hover:bg-blue-700 hover:-translate-y-1 transition-all">
              Join the Journey
            </button>
            <button className="flex items-center space-x-3 group">
              <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-blue-600 transition-colors">
                <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </div>
              <span className="text-sm font-bold text-slate-600 group-hover:text-blue-600 transition-colors">Watch Overview</span>
            </button>
          </div>
        </div>
        <div className="relative animate-fadeIn">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-100/40 to-indigo-100/40 blur-3xl rounded-[4rem]" />
          <div className="relative bg-white border-8 border-white rounded-[3rem] shadow-2xl shadow-blue-100/50 overflow-hidden transform rotate-2">
            <img src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=1000" alt="Volunteers meeting" className="w-full h-[500px] object-cover" />
            <div className="absolute bottom-10 left-10 right-10 bg-white/90 backdrop-blur p-6 rounded-2xl border border-white/50 shadow-xl">
               <div className="flex items-center space-x-4">
                 <div className="flex -space-x-3">
                    {[1,2,3].map(i => <img key={i} src={`https://picsum.photos/seed/${i+10}/40/40`} className="w-10 h-10 rounded-full border-4 border-white" alt="" />)}
                 </div>
                 <div>
                   <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Active Learners</p>
                   <p className="text-sm font-bold text-slate-500">1.2k volunteers serving today</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <h2 className="text-4xl font-black tracking-tight text-slate-900">Everything you need to lead.</h2>
            <p className="text-slate-500 font-medium leading-relaxed text-lg">We've built a training environment that removes friction and builds confidence for your team.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { title: 'Personalized Paths', icon: 'M13 10V3L4 14h7v7l9-11h-7z', desc: 'Custom learning journeys tailored to specific ministry roles and departments.' },
              { title: 'Rich Content', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', desc: 'Engage with video, PDFs, and interactive quizzes designed for deep retention.' },
              { title: 'Progress Tracking', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', desc: 'Real-time reporting for leaders to ensure sanctuary safety and excellence.' }
            ].map((f, i) => (
              <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={f.icon} /></svg>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-white border-t border-slate-100">
         <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center space-y-10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>
              </div>
              <span className="text-lg font-black tracking-tighter uppercase">Journey LMS</span>
            </div>
            <p className="text-slate-400 text-sm font-medium">© 2025 Journey Learning Management. All rights reserved.</p>
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;
