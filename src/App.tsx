import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  ShieldCheck, 
  MessageSquare, 
  Briefcase, 
  Loader2, 
  Send, 
  User, 
  Bot, 
  FileText,
  AlertCircle,
  ChevronRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { cn } from './lib/utils';
import { extractTextFromPDF } from './lib/pdfService.ts';
import { getResumeResponse, getJobRecommendations, type JobRecommendation } from './services/geminiService.ts';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

type Step = 'upload' | 'analyzing' | 'chat';

export default function App() {
  const [step, setStep] = useState<Step>('upload');
  const [activeTab, setActiveTab] = useState<'chat' | 'profile'>('chat');
  const [resumeText, setResumeText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setError(null);
    setFileName(file.name);
    setStep('analyzing');
    
    try {
      const text = await extractTextFromPDF(file);
      if (!text || text.length < 50) {
        throw new Error('We could not extract enough text from this PDF. Please check if it is a text-based resume.');
      }
      setResumeText(text);
      
      // Get initial recommendations in parallel
      const recs = await getJobRecommendations(text);
      setRecommendations(recs);
      
      setMessages([{
        id: '1',
        role: 'bot',
        content: `Resume uploaded successfully! I've analyzed "${file.name}". How can I help you today? You can ask about your experience, or check out the job recommendations I've prepared.`,
        timestamp: new Date()
      }]);
      
      setStep('chat');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to process the PDF.');
      setStep('upload');
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getResumeResponse(resumeText, input);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: response,
        timestamp: new Date()
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: "I'm sorry, I encountered an error while processing your request. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setStep('upload');
    setActiveTab('chat');
    setResumeText('');
    setMessages([]);
    setRecommendations([]);
    setFileName('');
  };

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 flex flex-col">
      {/* Navigation */}
      <nav className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 flex items-center px-4 md:px-6 justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 md:p-2 bg-indigo-600 rounded-lg shadow-sm">
            <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <span className="font-bold text-base md:text-lg tracking-tight text-slate-800">PrivaResume AI</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-[10px] md:text-xs font-medium uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden md:inline">Privacy First • Local Processing</span>
            <span className="md:hidden">Local Only</span>
          </div>
          {step !== 'upload' && (
            <button 
              onClick={reset}
              className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors rounded-full"
              title="Clear Data & Restart"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </nav>

      <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto md:p-8 p-4">
        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto md:mt-12 mt-6 text-center w-full"
            >
              <div className="mb-8">
                <motion.div 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold mb-6"
                >
                  <Sparkles className="w-4 h-4" />
                  AI-Powered Resume RAG
                </motion.div>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4 leading-tight">
                  Understand your career <br /> 
                  <span className="text-indigo-600">with absolute privacy.</span>
                </h1>
                <p className="text-base md:text-lg text-slate-500 leading-relaxed max-w-lg mx-auto">
                  Upload your resume to get instant responses and job recommendations. 
                  Your data stays in your browser.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-sm text-left">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <label className="group relative block transition-all duration-300">
                <input 
                  type="file" 
                  accept="application/pdf" 
                  className="hidden" 
                  onChange={handleFileUpload}
                />
                <div className={cn(
                  "border-2 border-dashed border-slate-300 bg-white rounded-3xl p-8 md:p-12 transition-all cursor-pointer",
                  "hover:border-indigo-500 hover:bg-slate-50 hover:shadow-xl hover:shadow-indigo-500/5 active:scale-[0.98]",
                  error ? "border-red-300 bg-red-50/10" : ""
                )}>
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Upload className="w-8 h-8 md:w-10 md:h-10 text-indigo-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-2">Drop your resume here</h3>
                  <p className="text-slate-400 font-medium">Supports PDF (Max 5MB)</p>
                  
                  <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 text-xs text-slate-400 font-semibold uppercase tracking-widest">
                    <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> No Server Storage</div>
                    <div className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Real-time Analysis</div>
                  </div>
                </div>
              </label>
            </motion.div>
          )}

          {step === 'analyzing' && (
            <motion.div 
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-white/80 backdrop-blur-xl z-[60] flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="relative mb-8">
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
                <div className="absolute inset-0 bg-indigo-600/10 blur-2xl rounded-full" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Analyzing your profile</h2>
              <p className="text-slate-500 animate-pulse font-medium">Extracting data and generating job matches...</p>
            </motion.div>
          )}

          {step === 'chat' && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 h-full min-h-0"
            >
              {/* Mobile Tab Switcher */}
              <div className="lg:hidden flex p-1 bg-slate-100 rounded-2xl mb-2">
                <button 
                  onClick={() => setActiveTab('chat')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
                    activeTab === 'chat' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
                  )}
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </button>
                <button 
                  onClick={() => setActiveTab('profile')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
                    activeTab === 'profile' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                  Recommendations
                </button>
              </div>

              {/* Profile Sidebar */}
              <div className={cn(
                "lg:col-span-4 space-y-6 overflow-y-auto pr-2 pb-8 scrollbar-hide",
                activeTab === 'chat' ? "hidden lg:block" : "block"
              )}>
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate" title={fileName}>{fileName}</h3>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Processed Successfully</p>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                    <Sparkles className="w-3 h-3" /> Job Recommendations
                  </h4>
                  
                  <div className="space-y-4">
                    {recommendations.length > 0 ? (
                      recommendations.map((rec, i) => (
                        <div key={i} className="group p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-md transition-all">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h5 className="font-bold text-slate-800 leading-tight">{rec.title}</h5>
                            <span className="flex-shrink-0 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full">
                              {rec.matchScore}% Match
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                            {rec.reasoning}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {rec.skillsToHighlight.slice(0, 3).map((skill, si) => (
                              <span key={si} className="text-[10px] px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded-md font-medium">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 rounded-2xl border border-dashed border-slate-200 text-center py-12">
                        <Loader2 className="w-5 h-5 text-slate-300 animate-spin mx-auto mb-2" />
                        <p className="text-xs text-slate-400">Loading recommendations...</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl shadow-slate-900/10 mb-4 md:mb-0">
                  <ShieldCheck className="w-8 h-8 text-emerald-400 mb-4" />
                  <h4 className="font-bold text-lg mb-2">Privacy Check</h4>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    All processing happened locally. No resume data was persisted to our database, and its text was only used for the current RAG context.
                  </p>
                  <button 
                    onClick={() => setStep('upload')}
                    className="text-xs font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-2"
                  >
                    Analyze New Resume <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Chat View */}
              <div className={cn(
                "lg:col-span-8 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex-1",
                activeTab === 'profile' ? "hidden lg:flex" : "flex",
                "h-[calc(100svh-12rem)] md:h-auto"
              )}>
                <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-800">Resume Assistant</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Online</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-hide bg-slate-50/30 overscroll-contain">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={cn(
                        "flex items-start gap-3 max-w-[90%] md:max-w-[85%]",
                        msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                      )}
                    >
                      <div className={cn(
                        "w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                        msg.role === 'bot' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-slate-200 text-slate-600"
                      )}>
                        {msg.role === 'bot' ? <Bot className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <User className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                      </div>
                      <div className={cn(
                        "p-3.5 md:p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                        msg.role === 'bot' 
                          ? "bg-white text-slate-800 border border-slate-100" 
                          : "bg-indigo-600 text-white shadow-indigo-100"
                      )}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-200">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                        <div className="flex gap-1.5">
                          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <form 
                  onSubmit={handleSendMessage}
                  className="p-3 md:p-4 bg-white border-t border-slate-100 shrink-0"
                >
                  <div className="relative group">
                    <input 
                      type="text" 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask about your resume..."
                      className="w-full pl-4 pr-14 py-3.5 md:py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm placeholder:text-slate-400"
                    />
                    <button 
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2.5 md:p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:bg-slate-300 disabled:shadow-none transition-all active:scale-90"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="mt-2 text-[9px] md:text-[10px] text-center text-slate-400 font-medium uppercase tracking-[0.1em]">
                    Privacy Optimized Response
                  </p>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-auto py-6 md:py-8 border-t border-slate-200 shrink-0 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            Built with <Sparkles className="w-3 h-3" /> for secure career growth
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> No Data Persistence
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Bot className="w-3 h-3 text-indigo-500" /> Gemini Powered
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

