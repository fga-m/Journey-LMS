
import React, { useState } from 'react';
import { TrainingModule, Role, Department, Chapter, ContentType, Question, QuestionType } from '../types';

interface ModuleManagerProps {
  modules: TrainingModule[];
  roles: Role[];
  departments: Department[];
  onCreateModule: (m: TrainingModule) => void;
  onUpdateModule: (m: TrainingModule) => void;
  onPreviewModule?: (id: string) => void;
}

const ModuleManager: React.FC<ModuleManagerProps> = ({ modules, roles, departments, onCreateModule, onUpdateModule, onPreviewModule }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<TrainingModule | null>(null);
  const [assignmentTab, setAssignmentTab] = useState<'DEPTS' | 'ROLES' | 'CHAPTERS'>('CHAPTERS');
  const [expandedChapterIdx, setExpandedChapterIdx] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<TrainingModule>>({ 
    title: '', 
    description: '', 
    targetRoleIds: [], 
    targetDepartmentIds: [],
    chapters: [],
    durationMinutes: 30,
    isSequential: true
  });

  const handleOpenCreate = () => {
    setEditingModule(null);
    setFormData({ 
      title: '', 
      description: '', 
      targetRoleIds: [], 
      targetDepartmentIds: [],
      chapters: [{ id: 'c' + Date.now(), title: 'Introduction', contentType: 'VIDEO', contentUrl: '', questions: [] }],
      durationMinutes: 30,
      isSequential: true
    });
    setAssignmentTab('CHAPTERS');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: TrainingModule) => {
    setEditingModule(m);
    setFormData({ ...m });
    setAssignmentTab('CHAPTERS');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isCompulsory = (formData.targetRoleIds || []).length === 0 && (formData.targetDepartmentIds || []).length === 0;
    
    if (editingModule) {
      onUpdateModule({ ...editingModule, ...formData, isCompulsory } as TrainingModule);
    } else {
      onCreateModule({ ...formData, id: 'm' + Date.now(), isCompulsory, isSequential: true } as TrainingModule);
    }
    setIsModalOpen(false);
  };

  const addChapter = () => {
    const newIdx = (formData.chapters?.length || 0);
    setFormData(f => ({
      ...f,
      chapters: [...(f.chapters || []), { id: 'c' + Date.now() + Math.random(), title: 'New Chapter', contentType: 'VIDEO', contentUrl: '', questions: [] }]
    }));
    setExpandedChapterIdx(newIdx);
  };

  const updateChapter = (index: number, updates: Partial<Chapter>) => {
    setFormData(f => {
      const newChapters = [...(f.chapters || [])];
      newChapters[index] = { ...newChapters[index], ...updates };
      return { ...f, chapters: newChapters };
    });
  };

  const addQuestion = (chapterIdx: number) => {
    const chapter = formData.chapters![chapterIdx];
    const newQuestion: Question = { id: 'q' + Date.now(), text: '', type: 'TEXT', options: [], correctAnswer: '' };
    updateChapter(chapterIdx, { questions: [...chapter.questions, newQuestion] });
  };

  const updateQuestion = (chapterIdx: number, qIdx: number, updates: Partial<Question>) => {
    const chapter = formData.chapters![chapterIdx];
    const newQuestions = [...chapter.questions];
    newQuestions[qIdx] = { ...newQuestions[qIdx], ...updates };
    updateChapter(chapterIdx, { questions: newQuestions });
  };

  const removeQuestion = (chapterIdx: number, qIdx: number) => {
    const chapter = formData.chapters![chapterIdx];
    updateChapter(chapterIdx, { questions: chapter.questions.filter((_, i) => i !== qIdx) });
  };

  const removeChapter = (index: number) => {
    setFormData(f => ({ ...f, chapters: (f.chapters || []).filter((_, i) => i !== index) }));
  };

  const toggleDept = (id: string) => {
    setFormData(f => {
      const current = f.targetDepartmentIds || [];
      return { ...f, targetDepartmentIds: current.includes(id) ? current.filter(d => d !== id) : [...current, id] };
    });
  };

  const toggleRole = (id: string) => {
    setFormData(f => {
      const current = f.targetRoleIds || [];
      return { ...f, targetRoleIds: current.includes(id) ? current.filter(r => r !== id) : [...current, id] };
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900">Module Library</h2>
          <p className="text-sm text-gray-500">Design training content for foundational, departmental, and role-specific paths.</p>
        </div>
        <button onClick={handleOpenCreate} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Create Module
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {modules.map(m => (
          <div key={m.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col space-y-1">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest inline-block w-fit ${m.isCompulsory ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                    {m.isCompulsory ? 'Global Foundation' : 'Specialized'}
                  </span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase">{m.chapters.length} Chapters • {m.chapters.reduce((acc, c) => acc + c.questions.length, 0)} Quiz Questions</span>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">{m.durationMinutes} min</span>
              </div>
              <h4 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{m.title}</h4>
              <p className="text-sm text-gray-500 mb-6 line-clamp-2 leading-relaxed">{m.description}</p>
              
              <div className="space-y-3 mb-6">
                {m.targetDepartmentIds?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-300 w-full mb-1">Departments:</span>
                    {m.targetDepartmentIds.map(did => <span key={did} className="text-[9px] px-2 py-1 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 font-bold uppercase tracking-wider">{departments.find(d => d.id === did)?.name}</span>)}
                  </div>
                )}
                {(m.targetRoleIds || []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-300 w-full mb-1">Specific Roles:</span>
                    {m.targetRoleIds.map(rid => <span key={rid} className="text-[9px] px-2 py-1 bg-indigo-50 text-indigo-500 rounded-lg border border-indigo-100 font-bold uppercase tracking-wider">{roles.find(r => r.id === rid)?.name}</span>)}
                  </div>
                )}
                {m.isCompulsory && <span className="text-[9px] px-2 py-1 bg-gray-50 text-gray-400 rounded-lg border border-gray-100 font-bold uppercase tracking-wider inline-block">Assigned to All Volunteers</span>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
              <button onClick={() => onPreviewModule?.(m.id)} className="py-2.5 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors">Preview</button>
              <button onClick={() => handleOpenEdit(m)} className="py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors flex items-center justify-center">
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600 transition-colors z-10">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="mb-8"><h3 className="text-2xl font-black text-gray-900 mb-2">{editingModule ? 'Edit Training Module' : 'Create New Module'}</h3><p className="text-sm text-gray-500">{editingModule ? `Updating: ${editingModule.title}` : 'Fill in the details to add a new learning block to the library.'}</p></div>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
              <div className="overflow-y-auto pr-2 flex-1 space-y-8 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Module Title</label>
                      <input type="text" placeholder="e.g. Greeting with Excellence" required className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-semibold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                    </div>
                    <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Description</label>
                      <textarea placeholder="Provide an overview..." required rows={3} className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-medium leading-relaxed" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Duration (Mins)</label>
                        <input type="number" className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-semibold" value={formData.durationMinutes} onChange={e => setFormData({...formData, durationMinutes: parseInt(e.target.value) || 0})} />
                      </div>
                      <div className="flex items-end pb-4">
                        <label className="flex items-center space-x-3 cursor-pointer group">
                          <input type="checkbox" className="w-5 h-5 rounded-md border-2 border-gray-200 text-blue-600 focus:ring-blue-500 transition-all" checked={formData.isSequential} onChange={e => setFormData({...formData, isSequential: e.target.checked})} />
                          <span className="text-xs font-bold text-gray-700 group-hover:text-blue-600 transition-colors">Force Sequential</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center space-x-4 border-b border-gray-100 pb-2">
                    <button type="button" onClick={() => setAssignmentTab('CHAPTERS')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${assignmentTab === 'CHAPTERS' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-gray-100 text-gray-400'}`}>Curriculum ({formData.chapters?.length || 0})</button>
                    <button type="button" onClick={() => setAssignmentTab('DEPTS')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${assignmentTab === 'DEPTS' ? 'bg-amber-600 text-white shadow-lg shadow-amber-100' : 'bg-gray-100 text-gray-400'}`}>Departments ({formData.targetDepartmentIds?.length || 0})</button>
                    <button type="button" onClick={() => setAssignmentTab('ROLES')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${assignmentTab === 'ROLES' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-100 text-gray-400'}`}>Roles ({formData.targetRoleIds?.length || 0})</button>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-[2.5rem] border-2 border-gray-100 min-h-[400px]">
                    {assignmentTab === 'CHAPTERS' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Training Steps & Assessments</h4>
                          <button type="button" onClick={addChapter} className="bg-blue-100 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-200 transition-all">+ Add Chapter</button>
                        </div>
                        <div className="space-y-4">
                          {(formData.chapters || []).map((ch, idx) => (
                            <div key={ch.id} className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
                              <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpandedChapterIdx(expandedChapterIdx === idx ? null : idx)}>
                                <div className="flex items-center space-x-4">
                                  <span className="w-6 h-6 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                                  <span className="text-sm font-bold text-gray-800">{ch.title || 'Untitled Chapter'}</span>
                                  <span className="text-[9px] font-black text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded-md">{ch.contentType}</span>
                                  <span className="text-[9px] font-black text-blue-400 uppercase">{ch.questions.length} Questions</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button type="button" onClick={(e) => { e.stopPropagation(); removeChapter(idx); }} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedChapterIdx === idx ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                              </div>
                              {expandedChapterIdx === idx && (
                                <div className="p-6 border-t border-gray-100 bg-gray-50/50 space-y-6">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Title</label>
                                      <input type="text" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500" value={ch.title} onChange={e => updateChapter(idx, { title: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Type</label>
                                        <select className="w-full bg-white border border-gray-200 rounded-xl px-2 py-2 text-sm outline-none focus:border-blue-500" value={ch.contentType} onChange={e => updateChapter(idx, { contentType: e.target.value as ContentType })}>
                                          <option value="VIDEO">Video</option><option value="PDF">PDF</option><option value="LINK">Link</option>
                                        </select>
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Media URL</label>
                                        <input type="text" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500" value={ch.contentUrl} onChange={e => updateChapter(idx, { contentUrl: e.target.value })} />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="pt-4 border-t border-gray-100">
                                    <div className="flex justify-between items-center mb-4"><h5 className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Chapter Quiz</h5><button type="button" onClick={() => addQuestion(idx)} className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100">+ Add Question</button></div>
                                    <div className="space-y-4">
                                      {ch.questions.map((q, qIdx) => (
                                        <div key={q.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                                          <div className="flex gap-4">
                                            <div className="flex-1 space-y-1">
                                              <label className="text-[8px] font-black text-gray-400 uppercase">Question Text</label>
                                              <input type="text" className="w-full border-b border-gray-100 py-1 text-xs font-bold outline-none focus:border-blue-500" value={q.text} onChange={e => updateQuestion(idx, qIdx, { text: e.target.value })} placeholder="Enter your question here..." />
                                            </div>
                                            <div className="w-32 space-y-1">
                                              <label className="text-[8px] font-black text-gray-400 uppercase">Type</label>
                                              <select className="w-full bg-gray-50 rounded-lg px-2 py-1 text-[10px] font-bold outline-none" value={q.type} onChange={e => updateQuestion(idx, qIdx, { type: e.target.value as QuestionType })}>
                                                <option value="TEXT">Short Answer</option><option value="MULTIPLE_CHOICE">Multiple Choice</option>
                                              </select>
                                            </div>
                                            <button type="button" onClick={() => removeQuestion(idx, qIdx)} className="self-end p-1.5 text-gray-300 hover:text-red-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                          </div>
                                          {q.type === 'MULTIPLE_CHOICE' && (
                                            <div className="pl-4 border-l-2 border-blue-50 space-y-2">
                                              <label className="text-[8px] font-black text-blue-400 uppercase">Options (check correct one)</label>
                                              {(q.options || []).map((opt, oIdx) => (
                                                <div key={oIdx} className="flex items-center space-x-2">
                                                  <input type="radio" checked={q.correctAnswer === opt} onChange={() => updateQuestion(idx, qIdx, { correctAnswer: opt })} name={`correct-${q.id}`} className="w-3 h-3 text-blue-600" />
                                                  <input type="text" className="flex-1 bg-gray-50 rounded-lg px-2 py-1 text-[10px] outline-none" value={opt} onChange={e => {
                                                    const newOpts = [...(q.options || [])];
                                                    newOpts[oIdx] = e.target.value;
                                                    updateQuestion(idx, qIdx, { options: newOpts });
                                                  }} />
                                                  <button type="button" onClick={() => updateQuestion(idx, qIdx, { options: (q.options || []).filter((_, i) => i !== oIdx) })} className="text-gray-300 hover:text-red-400">×</button>
                                                </div>
                                              ))}
                                              <button type="button" onClick={() => updateQuestion(idx, qIdx, { options: [...(q.options || []), ''] })} className="text-[8px] font-black text-blue-500 hover:underline">+ Add Option</button>
                                            </div>
                                          )}
                                          {q.type === 'TEXT' && (
                                            <div className="pl-4 border-l-2 border-green-50 space-y-1">
                                              <label className="text-[8px] font-black text-green-400 uppercase">Correct Answer Keyword</label>
                                              <input type="text" className="w-full bg-gray-50 rounded-lg px-2 py-1 text-[10px] outline-none" value={q.correctAnswer} onChange={e => updateQuestion(idx, qIdx, { correctAnswer: e.target.value })} placeholder="Required keyword for success..." />
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {assignmentTab === 'DEPTS' && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {departments.map(d => {
                          const isSelected = formData.targetDepartmentIds?.includes(d.id);
                          return (
                            <button key={d.id} type="button" onClick={() => toggleDept(d.id)} className={`p-4 text-left rounded-2xl border-2 transition-all flex items-center justify-between ${isSelected ? 'bg-amber-600 border-amber-600 text-white' : 'bg-white border-white text-gray-500 hover:border-amber-200'}`}>
                              <span className="text-[10px] font-black uppercase truncate">{d.name}</span>
                              {isSelected && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {assignmentTab === 'ROLES' && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {roles.map(r => {
                          const isSelected = formData.targetRoleIds?.includes(r.id);
                          const dept = departments.find(d => d.id === r.departmentId);
                          return (
                            <button key={r.id} type="button" onClick={() => toggleRole(r.id)} className={`p-4 text-left rounded-2xl border-2 transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-white text-gray-500 hover:border-indigo-200'}`}>
                              <span className="text-[10px] font-black uppercase block truncate">{r.name}</span>
                              <span className={`text-[8px] font-bold block mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-gray-300'}`}>{dept?.name || 'Shared'}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-8 border-t border-gray-100 flex gap-4 mt-auto bg-white">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-100 hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 transition-all">{editingModule ? 'Save Module' : 'Create Module'}</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 bg-gray-100 text-gray-600 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleManager;
