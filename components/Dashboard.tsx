import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TrainingModule, Volunteer, Chapter, Role, Department, Journey } from '../types.ts';

interface DashboardProps {
  volunteers: Volunteer[];
  modules: TrainingModule[];
  journeys: Journey[];
  roles: Role[];
  departments: Department[];
  onCompleteChapter: (id: string) => void;
  onResetChapter?: (id: string) => void;
  currentUser: Volunteer | null;
  initialModuleId?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  volunteers, 
  modules, 
  journeys, 
  roles, 
  departments, 
  onCompleteChapter, 
  onResetChapter,
  currentUser, 
  initialModuleId 
}) => {
  const [activeModuleId, setActiveModuleId] = useState<string | null>(initialModuleId || null);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [chapterErrors, setChapterErrors] = useState<Record<string, string>>({});
  const [wrongQuestionIds, setWrongQuestionIds] = useState<string[]>([]);
  const [validatedQuestionIds, setValidatedQuestionIds] = useState<string[]>([]);
  const [resetConfirmId, setResetConfirmId] = useState<string | null>(null);
  const quizRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialModuleId) {
      setActiveModuleId(initialModuleId);
      setActiveChapterIndex(0);
      setQuizAnswers({});
      setChapterErrors({});
      setWrongQuestionIds([]);
      setValidatedQuestionIds([]);
      setResetConfirmId(null);
    }
  }, [initialModuleId]);

  useEffect(() => {
    setChapterErrors({});
    setWrongQuestionIds([]);
    setValidatedQuestionIds([]);
    setResetConfirmId(null);
  }, [activeChapterIndex, activeModuleId]);

  const activeModule = useMemo(() => modules.find(m => m.id === activeModuleId) || null, [modules, activeModuleId]);

  const phasedModules = useMemo(() => {
    if (!currentUser) return [];
    const phases: { label: string; modules: TrainingModule[]; type: 'FOUNDATION' | 'CORE' | 'PROGRESSION' }[] = [
      { label: 'Foundation Step (Global Core)', modules: modules.filter(m => m.isCompulsory), type: 'FOUNDATION' },
      { label: 'Ministry Step (Department Core)', modules: [], type: 'CORE' },
      { label: 'Role Journey Progression', modules: [], type: 'PROGRESSION' }
    ];
    currentUser.roleIds.forEach(roleId => {
      const role = roles.find(r => r.id === roleId);
      if (role) {
        const dept = departments.find(d => d.id === role.departmentId);
        if (dept) {
          dept.coreModuleIds.forEach(mid => {
            const m = modules.find(mod => mod.id === mid);
            if (m && !phases[1].modules.find(em => em.id === m.id)) phases[1].modules.push(m);
          });
          modules.filter(m => m.targetDepartmentIds?.includes(dept.id)).forEach(m => {
            if (!phases[1].modules.find(em => em.id === m.id)) phases[1].modules.push(m);
          });
          phases[1].label = `Ministry Step (${dept.name} Core)`;
        }
        modules.filter(m => m.targetRoleIds?.includes(role.id)).forEach(m => {
           if (!phases[2].modules.find(em => em.id === m.id)) phases[2].modules.push(m);
        });
        const journey = journeys.find(j => j.roleId === roleId);
        if (journey) {
          journey.progressionModuleIds.forEach(mid => {
            const m = modules.find(mod => mod.id === mid);
            if (m && !phases[2].modules.find(em => em.id === m.id)) phases[2].modules.push(m);
          });
        }
      }
    });
    return phases.filter(p => p.modules.length > 0);
  }, [modules, currentUser, roles, departments, journeys]);

  const calculateProgress = (m: TrainingModule) => {
    if (!m || m.chapters.length === 0) return 0;
    const completed = m.chapters.filter(c => currentUser?.completedChapterIds.includes(c.id)).length;
    return Math.round((completed / m.chapters.length) * 100);
  };

  const validateAndSaveChapter = (ch: Chapter) => {
    const currentWrongIds: string[] = [];
    const currentValidatedIds: string[] = [];
    let missingAnswer = false;
    ch.questions.forEach(q => {
      currentValidatedIds.push(q.id);
      const userAnswer = (quizAnswers[q.id] || '').trim();
      if (!userAnswer) {
        missingAnswer = true;
        currentWrongIds.push(q.id);
        return;
      }
      if (q.type === 'MULTIPLE_CHOICE') {
        if (userAnswer !== q.correctAnswer) currentWrongIds.push(q.id);
      } else if (q.type === 'TEXT') {
        const keyword = (q.correctAnswer || '').toLowerCase();
        if (!userAnswer.toLowerCase().includes(keyword)) currentWrongIds.push(q.id);
      }
    });
    setValidatedQuestionIds(currentValidatedIds);
    setWrongQuestionIds(currentWrongIds);
    if (missingAnswer) {
      setChapterErrors(prev => ({ ...prev, [ch.id]: "Please complete all questions in this section." }));
      return false;
    }
    if (currentWrongIds.length > 0) {
      setChapterErrors(prev => ({ ...prev, [ch.id]: "Some answers are incorrect. Please review the highlighted questions." }));
      return false;
    }
    setChapterErrors(prev => {
      const next = { ...prev };
      delete next[ch.id];
      return next;
    });
    onCompleteChapter(ch.id);
    return true;
  };

  const executeRetakeChapter = (ch: Chapter, switchToChapter: boolean = false) => {
    setQuizAnswers(prev => {
      const next = { ...prev };
      ch.questions.forEach(q => { next[q.id] = ""; });
      return next;
    });
    setChapterErrors(prev => {
      const next = { ...prev };
      delete next[ch.id];
      return next;
    });
    setWrongQuestionIds(prev => prev.filter(id => !ch.questions.some(q => q.id === id)));
    setValidatedQuestionIds(prev => prev.filter(id => !ch.questions.some(q => q.id === id)));
    if (onResetChapter) onResetChapter(ch.id);
    if (switchToChapter && activeModule) {
      const idx = activeModule.chapters.findIndex(c => c.id === ch.id);
      if (idx !== -1) setActiveChapterIndex(idx);
    }
    setResetConfirmId(null);
    if (activeModule?.chapters[activeChapterIndex].id === ch.id && quizRef.current) {
      quizRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleNext = () => {
    if (!activeModule) return;
    const ch = activeModule.chapters[activeChapterIndex];
    const isCompleted = currentUser?.completedChapterIds.includes(ch.id);
    if (!isCompleted) {
      if (ch.questions.length > 0) {
        const success = validateAndSaveChapter(ch);
        if (!success) return;
      } else {
        onCompleteChapter(ch.id);
      }
    }
    if (activeChapterIndex < activeModule.chapters.length - 1) {
      setActiveChapterIndex(idx => idx + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (activeModule) {
    const ch = activeModule.chapters[activeChapterIndex];
    const isCompleted = currentUser?.completedChapterIds.includes(ch.id);
    const isLastChapter = activeChapterIndex === activeModule.chapters.length - 1;
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col md:flex-row animate-fadeIn">
        <aside className="w-full md:w-80 bg-slate-900 text-white flex flex-col shadow-2xl z-20 overflow-hidden shrink-0">
          <div className="p-8 border-b border-slate-800">
            <button type="button" onClick={() => setActiveModuleId(null)} className="mb-6 text-blue-400 font-bold flex items-center group text-xs uppercase tracking-widest">
              <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              Exit Learning
            </button>
            <h1 className="text-xl font-black leading-tight mb-2">{activeModule.title}</h1>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${calculateProgress(activeModule)}%` }}></div>
            </div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">{calculateProgress(activeModule)}% Completed</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
            {activeModule.chapters.map((chapter, idx) => {
              const chapterCompleted = currentUser?.completedChapterIds.includes(chapter.id);
              const isActive = activeChapterIndex === idx;
              const isConfirmingReset = resetConfirmId === chapter.id;
              return (
                <div key={chapter.id} className="relative group">
                  <button type="button" onClick={() => setActiveChapterIndex(idx)} className={`w-full text-left p-4 rounded-2xl transition-all flex items-center space-x-4 ${isActive ? 'bg-blue-600 text-white shadow-lg' : chapterCompleted ? 'bg-green-500/10' : 'hover:bg-slate-800'}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${isActive ? 'bg-white text-blue-600' : chapterCompleted ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                      {chapterCompleted ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : chapterCompleted ? 'text-green-500' : 'text-slate-300'}`}>{chapter.title}</p>
                      <p className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-blue-100' : 'text-slate-600'}`}>{chapter.contentType}</p>
                    </div>
                  </button>
                  {chapterCompleted && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                      {isConfirmingReset ? (
                        <div className="flex items-center bg-red-600 rounded-lg overflow-hidden shadow-lg animate-slideUp">
                           <button type="button" onClick={(e) => { e.stopPropagation(); executeRetakeChapter(chapter, true); }} className="p-1.5 hover:bg-red-700 text-white transition-colors"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg></button>
                           <button type="button" onClick={(e) => { e.stopPropagation(); setResetConfirmId(null); }} className="p-1.5 bg-red-800 hover:bg-red-900 text-white transition-colors border-l border-red-700"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                      ) : (
                        <button type="button" onClick={(e) => { e.stopPropagation(); setResetConfirmId(chapter.id); }} className={`p-1.5 rounded-lg transition-all ${isActive ? 'text-blue-200 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-red-400 hover:bg-slate-700'}`}><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="p-6 bg-slate-800/50 border-t border-slate-800"><button type="button" onClick={() => setActiveModuleId(null)} className="w-full bg-slate-800 text-slate-400 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-700 transition-all border border-slate-700">Return to Dashboard</button></div>
        </aside>
        <main className="flex-1 overflow-y-auto bg-gray-50 flex flex-col">
          <div className="max-w-4xl mx-auto w-full py-16 px-8 flex-1">
            <div className="space-y-10 animate-slideUp">
              <div className="flex items-center space-x-6">
                <div className={`w-14 h-14 rounded-3xl flex items-center justify-center text-xl font-black shadow-sm border-2 ${isCompleted ? 'bg-green-50 border-green-200 text-green-500' : 'bg-white border-gray-100 text-blue-600'}`}>{activeChapterIndex + 1}</div>
                <div><h2 className="text-3xl font-black text-gray-900 tracking-tight">{ch.title}</h2><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Section {activeChapterIndex + 1} of {activeModule.chapters.length}</p></div>
              </div>
              <div className="aspect-video bg-black rounded-[3rem] shadow-2xl overflow-hidden border-8 border-white ring-1 ring-gray-200">
                {ch.contentType === 'VIDEO' ? <iframe className="w-full h-full" src={ch.contentUrl.replace('watch?v=', 'embed/')} title="Video" frameBorder="0" allowFullScreen></iframe> : <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-12 text-center text-white"><svg className="w-20 h-20 mb-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg><h3 className="text-xl font-bold mb-4">Reading Material</h3><a href={ch.contentUrl} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-blue-500 transition-all">Open Content</a></div>}
              </div>
              {ch.questions.length > 0 && (
                <div ref={quizRef} className={`p-10 rounded-[3rem] border transition-all ${isCompleted ? 'bg-white border-green-200 shadow-xl shadow-green-50' : 'bg-white border-gray-100 shadow-sm'}`}>
                  <div className="flex items-center justify-between mb-10"><div className="flex items-center space-x-3"><span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${isCompleted ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'}`}>?</span><h3 className="text-xl font-black text-gray-800 tracking-tight">Chapter Checkpoint</h3></div>
                    {isCompleted && (
                      <div className="flex items-center space-x-4"><span className="bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">Section Success</span>
                        {resetConfirmId === 'CONTENT_RETAKE' ? (
                           <div className="flex items-center bg-red-600 rounded-full overflow-hidden shadow-lg animate-slideUp"><button type="button" onClick={() => executeRetakeChapter(ch)} className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-red-700 transition-colors">Confirm Reset?</button><button type="button" onClick={() => setResetConfirmId(null)} className="px-3 py-2 text-[10px] font-black text-white hover:bg-red-800 bg-red-900/20 border-l border-red-500/30 transition-colors">Cancel</button></div>
                        ) : (
                          <button type="button" onClick={() => setResetConfirmId('CONTENT_RETAKE')} className="px-5 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95">Retake Section</button>
                        )}
                      </div>
                    )}
                  </div>
                  {chapterErrors[ch.id] && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-8 border border-red-100">{chapterErrors[ch.id]}</div>}
                  <div className="space-y-12">
                    {ch.questions.map((q, qIdx) => {
                      const hasBeenValidated = validatedQuestionIds.includes(q.id);
                      const isWrong = wrongQuestionIds.includes(q.id);
                      const isCorrect = hasBeenValidated && !isWrong;
                      return (
                        <div key={q.id} className={`space-y-6 transition-all relative ${isWrong ? 'p-6 bg-red-50/50 rounded-3xl ring-2 ring-red-100' : isCorrect ? 'p-6 bg-green-50/50 rounded-3xl ring-2 ring-green-100' : ''}`}>
                          <div className="flex items-start justify-between"><div className="flex items-start space-x-4"><span className={`text-[10px] font-black mt-1 ${isWrong ? 'text-red-400' : isCorrect ? 'text-green-500' : 'text-gray-300'}`}>{qIdx + 1}.</span><h4 className={`text-lg font-bold leading-tight ${isWrong ? 'text-red-900' : isCorrect ? 'text-green-900' : 'text-gray-900'}`}>{q.text}</h4></div>
                            {hasBeenValidated && <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center space-x-2 ${isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{isCorrect ? <><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg><span>Correct</span></> : <><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg><span>Incorrect</span></>}</div>}
                          </div>
                          <div className={`pl-8 space-y-3 ${isCompleted ? 'opacity-70 pointer-events-none' : ''}`}>
                            {q.type === 'MULTIPLE_CHOICE' ? <div className="grid grid-cols-1 gap-2">{(q.options || []).map(opt => <label key={opt} className={`flex items-center space-x-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${quizAnswers[q.id] === opt ? (isCorrect ? 'bg-green-600 border-green-600 text-white' : isWrong ? 'bg-red-600 border-red-600 text-white' : 'bg-blue-600 border-blue-600 text-white shadow-lg') : 'bg-white border-gray-100 hover:border-blue-100 text-gray-700'}`}><input type="radio" className="hidden" name={q.id} value={opt} disabled={isCompleted} checked={quizAnswers[q.id] === opt} onChange={e => { setQuizAnswers(prev => ({...prev, [q.id]: e.target.value})); setWrongQuestionIds(prev => prev.filter(id => id !== q.id)); setValidatedQuestionIds(prev => prev.filter(id => id !== q.id)); }} /><span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${quizAnswers[q.id] === opt ? 'bg-white border-white' : 'border-gray-200'}`}>{quizAnswers[q.id] === opt && <div className={`w-2 h-2 rounded-full ${isCorrect ? 'bg-green-600' : isWrong ? 'bg-red-600' : 'bg-blue-600'}`} />}</span><span className="font-bold text-sm">{opt}</span></label>)}</div> : <input type="text" disabled={isCompleted} placeholder={isCompleted ? "Reset section to change answer" : "Type your answer..."} className={`w-full bg-white border-2 p-4 rounded-2xl outline-none transition-all text-sm font-semibold ${isWrong ? 'border-red-200 focus:border-red-400' : isCorrect ? 'border-green-200 focus:border-green-400' : 'border-gray-100 focus:border-blue-500'}`} value={quizAnswers[q.id] || ''} onChange={e => { const val = e.target.value; setQuizAnswers(prev => ({...prev, [q.id]: val})); setWrongQuestionIds(prev => prev.filter(id => id !== q.id)); setValidatedQuestionIds(prev => prev.filter(id => id !== q.id)); }} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          <footer className="bg-white border-t border-gray-100 p-8 flex justify-between items-center sticky bottom-0 z-10 shadow-lg"><button type="button" onClick={() => setActiveChapterIndex(idx => Math.max(0, idx - 1))} disabled={activeChapterIndex === 0} className={`px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${activeChapterIndex === 0 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:bg-gray-50'}`}>Previous Section</button><div className="flex items-center space-x-4">{isCompleted ? <button type="button" onClick={isLastChapter ? () => setActiveModuleId(null) : handleNext} className="px-12 py-4 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all">{isLastChapter ? 'Finish Module' : 'Continue to Next Section'}</button> : <button type="button" onClick={handleNext} className="px-12 py-4 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all">{ch.questions.length > 0 ? 'Validate & Continue' : 'Complete & Next'}</button>}</div></footer>
        </main>
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 px-4"><div className="flex justify-between items-end"><div><h2 className="text-4xl font-black tracking-tight text-gray-900">Training Dashboard</h2><p className="text-gray-500 font-medium">Progress your roadmap from Foundation to Specialized Role mastery.</p></div></div>
      <div className="relative"><div className="absolute left-10 top-0 bottom-0 w-1 bg-gray-100 -translate-x-1/2 rounded-full hidden md:block"></div><div className="space-y-16">
          {phasedModules.map((phase) => (
            <div key={phase.label} className="space-y-8"><div className="relative md:pl-24 flex items-center"><div className="absolute left-10 w-5 h-5 bg-white rounded-full -translate-x-1/2 border-4 border-gray-100 shadow-sm z-20 hidden md:block"></div><h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{phase.label}</h3></div>
              {phase.modules.map((m) => {
                const prog = calculateProgress(m);
                return (
                  <div key={m.id} className="relative md:pl-24 group animate-fadeIn"><div className={`absolute left-10 w-10 h-10 rounded-2xl border-4 border-white shadow-lg z-20 -translate-x-1/2 items-center justify-center transition-all hidden md:flex ${prog === 100 ? 'bg-green-500 rotate-12 scale-110' : prog > 0 ? 'bg-blue-500' : 'bg-gray-200'}`}>{prog === 100 && <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}</div><div className="w-full bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all"><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6"><div className="flex-1"><div className="flex items-center space-x-3 mb-2"><h3 className="text-2xl font-black text-gray-900">{m.title}</h3>{prog === 100 && <span className="text-[9px] font-black text-green-500 uppercase bg-green-50 px-2 py-1 rounded-lg">Completed</span>}</div><p className="text-sm text-gray-500 mb-6 leading-relaxed max-w-2xl">{m.description}</p><div className="flex items-center space-x-4"><div className="flex-1 h-2.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100"><div className={`h-full transition-all duration-1000 ${prog === 100 ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${prog}%` }}></div></div><span className="text-xs font-black text-gray-400 w-12">{prog}%</span></div></div><button type="button" onClick={() => { setActiveModuleId(m.id); setActiveChapterIndex(0); setQuizAnswers({}); setChapterErrors({}); setWrongQuestionIds([]); setValidatedQuestionIds([]); }} className={`lg:ml-8 px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl transition-all active:scale-95 ${prog === 100 ? 'bg-white border-2 border-gray-100 text-gray-400 hover:bg-gray-50' : 'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700'}`}>{prog === 100 ? 'Review Module' : prog > 0 ? 'Resume Training' : 'Start Journey'}</button></div></div></div>
                );
              })}
            </div>
          ))}
        </div></div>
    </div>
  );
};

export default Dashboard;