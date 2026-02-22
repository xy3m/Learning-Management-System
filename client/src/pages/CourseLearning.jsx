import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, CheckCircle, Lock, BookOpen, AlertCircle, 
  Award, ChevronRight, FileText, Music, Video, 
  HelpCircle, RefreshCw, Activity 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- STYLED COMPONENTS ---

const GlassCard = ({ children, className = "" }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`
      relative overflow-hidden
      bg-black/40 backdrop-blur-xl 
      border border-[#50C878]/20 shadow-xl
      rounded-2xl p-6 
      ${className}
    `}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
    {children}
  </motion.div>
);

const CourseLearning = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem('user'));

    const [course, setCourse] = useState(null);
    const [progressData, setProgressData] = useState({ completedClassIndices: [], quizResults: [] });
    const [activeClassIndex, setActiveClassIndex] = useState(0);
    
    // MCQ State
    const [mcqState, setMcqState] = useState({}); 
    const [quizSubmitted, setQuizSubmitted] = useState(false);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        fetchCourseAndProgress();
    }, [courseId]);

    // Effect A: Reset Quiz ONLY when switching classes
    useEffect(() => {
        setMcqState({});
        setQuizSubmitted(false);
    }, [activeClassIndex]);

    // Effect B: Mark as visited when Course Loads or Class Changes
    useEffect(() => {
        if(course) {
            markClassVisited(activeClassIndex);
        }
    }, [activeClassIndex, course]);

    const fetchCourseAndProgress = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/learner/course/${courseId}/${user.id}`);
            setCourse(res.data.course);
            if(res.data.progress) setProgressData(res.data.progress);
        } catch (err) { toast.error("Failed to load course data"); }
    };

    const markClassVisited = async (idx) => {
        if (!progressData.completedClassIndices.includes(idx)) {
            const newIndices = [...progressData.completedClassIndices, idx];
            setProgressData(prev => ({ ...prev, completedClassIndices: newIndices }));
            
            await axios.post('http://localhost:5000/api/learner/progress', {
                learnerId: user.id,
                courseId,
                classIndex: idx
            });
        }
    };

    const handleOptionClick = (qIndex, option, correctAnswer) => {
        if (quizSubmitted) return; 
        setMcqState(prev => ({
            ...prev,
            [qIndex]: { selected: option, isCorrect: option === correctAnswer, correctAnswer }
        }));
    };

    const submitQuiz = async () => {
        const currentClass = course.classes[activeClassIndex];
        const totalQuestions = currentClass.mcq.length;
        let correctCount = 0;

        if (Object.keys(mcqState).length < totalQuestions) {
            toast.error("Please answer all questions before submitting.");
            return;
        }

        currentClass.mcq.forEach((q, idx) => {
            if (mcqState[idx]?.isCorrect) correctCount++;
        });

        const scorePercent = (correctCount / totalQuestions) * 100;
        const passed = scorePercent >= 50;

        setQuizSubmitted(true); 

        await axios.post('http://localhost:5000/api/learner/submit-quiz', {
            learnerId: user.id,
            courseId,
            classIndex: activeClassIndex,
            score: scorePercent,
            passed
        });

        if (passed) toast.success(`Quiz Passed! Score: ${scorePercent}%`);
        else toast.error(`Quiz Failed. Score: ${scorePercent}%`);

        fetchCourseAndProgress(); 
    };

    const isCertificateReady = () => {
        if (!course) return false;
        const totalClasses = course.classes.length;
        if (progressData.completedClassIndices.length < totalClasses) return false;

        const classesWithQuiz = course.classes.filter(c => c.mcq && c.mcq.length > 0);
        const passedQuizzes = progressData.quizResults.filter(q => q.passed);
        
        const uniquePassed = new Set(passedQuizzes.map(q => q.classIndex));
        return uniquePassed.size >= classesWithQuiz.length;
    };

    const downloadCertificate = () => {
        window.open(`http://localhost:5000/api/learner/certificate/${courseId}/${user.id}`, '_blank');
    };

    const getOptionStyle = (qIdx, opt) => {
        const selection = mcqState[qIdx];
        const isSelected = selection?.selected === opt;

        if (!quizSubmitted) {
            return isSelected 
                ? "bg-[#0B6E4F]/20 border-[#50C878] text-[#D1F2EB] shadow-[0_0_15px_rgba(99,102,241,0.3)]" 
                : "bg-black/20 border-[#50C878]/20 hover:bg-white/5 text-[#D1F2EB]/70";
        }

        if (isSelected) {
            return selection.isCorrect 
                ? "bg-green-500/20 border-green-500 text-green-400 font-bold" 
                : "bg-red-500/20 border-red-500 text-red-400"; 
        }
        
        if (selection && !selection.isCorrect && opt === selection.correctAnswer) {
             return "bg-green-500/10 border-green-500/30 text-green-400/70 border-dashed";
        }

        return "bg-black/20 border-[#50C878]/20 opacity-50"; 
    };

    if (!course) return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#50C878] border-t-transparent rounded-full animate-spin"/>
                <span className="text-yellow-400 font-mono text-sm">LOADING NEURAL LINK...</span>
            </div>
        </div>
    );

    const currentClass = course.classes[activeClassIndex];
    const progressPercent = Math.round((progressData.completedClassIndices.length / course.classes.length) * 100);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-200 pt-24 pb-10 px-6">
            <Toaster position="bottom-right" toastOptions={{ style: { background: '#1f2937', color: '#fff' }}}/>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* --- LEFT COLUMN: CONTENT PLAYER (8 Columns) --- */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* VIDEO PLAYER */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative aspect-video bg-[#0a0a0a] rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-[#50C878]/30 group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
                        <video
                            key={`vid-${currentClass.video}`} 
                            src={currentClass.video}
                            controls
                            controlsList="nodownload"
                            className="w-full h-full object-contain relative z-0"
                            preload="auto"
                        />
                    </motion.div>

                    {/* LESSON TITLE & AUDIO */}
                    <GlassCard>
                         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                             <div>
                                 <h1 className="text-2xl font-bold text-[#D1F2EB] mb-2">
                                     <span className="text-[#50C878] mr-2">#{activeClassIndex + 1}</span> 
                                     Lesson Module
                                 </h1>
                                 <p className="text-sm text-[#D1F2EB]/70 flex items-center gap-2">
                                     <Video size={14} className="text-[#50C878]"/> Video Lecture
                                     {currentClass.audio && <>• <Music size={14} className="text-[#0B6E4F]"/> Audio Available</>}
                                     {currentClass.text && <>• <FileText size={14} className="text-blue-500"/> Reading Notes</>}
                                 </p>
                             </div>
                             {currentClass.audio && (
                                <div className="bg-[#013220]/30 p-2 rounded-xl border border-[#50C878]/30 flex items-center gap-3 min-w-[200px]">
                                    <div className="p-2 bg-[#0B6E4F]/20 rounded-lg text-[#50C878]">
                                        <Music size={16} />
                                    </div>
                                    <audio 
                                        key={`aud-${currentClass.audio}`}
                                        src={currentClass.audio} 
                                        controls 
                                        className="h-8 w-32 md:w-48" 
                                    />
                                </div>
                             )}
                         </div>

                         {/* TEXT CONTENT */}
                         <div className="p-6 bg-black/20 rounded-xl border border-[#50C878]/20">
                             <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                 <BookOpen size={16} /> Transcript & Notes
                             </h3>
                             <div className="text-[#D1F2EB]/90 leading-relaxed whitespace-pre-wrap text-base font-light">
                                 {currentClass.text || <span className="text-yellow-200 italic flex items-center gap-2"><AlertCircle size={14}/> No supplementary notes provided for this lesson.</span>}
                             </div>
                         </div>
                    </GlassCard>

                    {/* QUIZ SECTION */}
                    {currentClass.mcq && currentClass.mcq.length > 0 && (
                        <GlassCard className="border-[#50C878]/20 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                            <div className="flex justify-between items-center mb-8 border-b border-[#50C878]/30 pb-4">
                                <h2 className="text-xl font-bold text-[#D1F2EB] flex items-center gap-3">
                                    <HelpCircle className="text-[#50C878]" />
                                    Knowledge Check
                                </h2>
                                {quizSubmitted && (
                                    <span className="px-3 py-1 bg-[#0B6E4F] text-[#D1F2EB]/70 rounded-lg text-xs font-mono uppercase">
                                        Quiz Completed
                                    </span>
                                )}
                            </div>
                            
                            <div className="space-y-8">
                                {currentClass.mcq.map((q, qIdx) => (
                                    <div key={qIdx} className="space-y-4">
                                        <p className="text-lg text-[#D1F2EB] font-medium flex gap-3">
                                            <span className="text-[#50C878] font-mono">0{qIdx + 1}.</span> 
                                            {q.question}
                                        </p>
                                        <div className="grid grid-cols-1 gap-3 pl-8">
                                            {q.options.map((opt, oIdx) => (
                                                <button
                                                    key={oIdx}
                                                    onClick={() => handleOptionClick(qIdx, opt, q.answer)}
                                                    disabled={quizSubmitted}
                                                    className={`
                                                        w-full text-left p-4 rounded-xl border transition-all duration-200 flex justify-between items-center group relative overflow-hidden
                                                        ${getOptionStyle(qIdx, opt)}
                                                    `}
                                                >
                                                    <span className="relative z-10">{opt}</span>
                                                    {quizSubmitted && mcqState[qIdx]?.selected === opt && (
                                                        <span className="text-xl relative z-10">
                                                            {mcqState[qIdx].isCorrect ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {!quizSubmitted ? (
                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={submitQuiz} 
                                    className="mt-8 w-full py-4 bg-gradient-to-r from-[#0B6E4F] to-[#0B6E4F] hover:from-[#50C878] hover:to-[#0B6E4F] text-[#D1F2EB] font-bold rounded-xl shadow-lg shadow-[#50C878]/20 transition-all"
                                >
                                    Submit Answers
                                </motion.button>
                            ) : (
                                <div className="mt-8 p-4 bg-[#50C878]/10 border border-[#50C878]/20 rounded-xl text-center">
                                    <p className="text-[#D1F2EB] flex items-center justify-center gap-2">
                                        <CheckCircle size={18} />
                                        Results recorded. Check the playlist sidebar for status.
                                    </p>
                                </div>
                            )}
                        </GlassCard>
                    )}
                </div>

                {/* --- RIGHT COLUMN: PLAYLIST & PROGRESS (4 Columns) --- */}
                {/* FIX: Applied 'sticky' to the PARENT container and Flexbox for children to prevent overlap */}
                <div className="lg:col-span-4 lg:sticky lg:top-24 lg:h-[calc(100vh-120px)] flex flex-col gap-6">
                    
                    {/* PROGRESS CARD (Fixed Height Flex Item) */}
                    <GlassCard className="flex-shrink-0">
                         <div className="flex justify-between items-end mb-4">
                             <div>
                                 <h3 className="text-[#D1F2EB]/70 text-xs font-bold uppercase tracking-widest mb-1">Course Progress</h3>
                                 <p className="text-3xl font-mono font-bold text-[#D1F2EB]">{progressPercent}%</p>
                             </div>
                             <div className="p-2 bg-[#50C878]/10 rounded-lg text-[#50C878]">
                                 <Activity size={24} />
                             </div>
                         </div>
                         
                         {/* Progress Bar */}
                         <div className="w-full bg-black/50 rounded-full h-2 overflow-hidden mb-6 border border-[#50C878]/20">
                             <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-[#50C878] to-[#0B6E4F]" 
                             />
                         </div>

                         {/* Certificate Status */}
                         <div className="p-4 bg-black/20 rounded-xl border border-[#50C878]/20">
                             {isCertificateReady() ? (
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={downloadCertificate} 
                                    className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-[#D1F2EB] font-bold rounded-lg shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                                >
                                    <Award size={18} />
                                    Claim Certificate
                                </motion.button>
                             ) : (
                                <div className="flex items-center gap-3 text-yellow-400">
                                    <Lock size={18} />
                                    <p className="text-xs leading-relaxed">
                                        Complete all lessons &amp; pass quizzes (&gt;50%) to unlock your certification.
                                    </p>
                                </div>
                             )}
                         </div>
                    </GlassCard>

                    {/* PLAYLIST (Fills Remaining Height & Scrolls Internally) */}
                    <div className="flex-1 bg-[#0b0f19] border border-[#50C878]/30 rounded-2xl overflow-hidden flex flex-col min-h-0">
                        <div className="p-5 border-b border-[#50C878]/20 bg-black/50 backdrop-blur-md flex-shrink-0 z-10">
                            <h3 className="font-bold text-[#D1F2EB] text-base truncate">{course.title}</h3>
                            <p className="text-xs text-yellow-400 mt-1 uppercase tracking-wide">
                                {course.classes.length} Modules • {course.instructorId?.name}
                            </p>
                        </div>

                        <div className="overflow-y-auto p-2 space-y-1 custom-scrollbar flex-1">
                            {course.classes.map((cls, idx) => {
                                const result = progressData.quizResults.find(r => r.classIndex === idx);
                                const isVisited = progressData.completedClassIndices.includes(idx);
                                const isActive = idx === activeClassIndex;

                                return (
                                    <motion.div
                                        key={idx}
                                        onClick={() => setActiveClassIndex(idx)}
                                        whileHover={{ x: 4 }}
                                        className={`
                                            group cursor-pointer p-3 rounded-xl border transition-all duration-200 relative overflow-hidden flex-shrink-0
                                            ${isActive 
                                                ? 'bg-[#0B6E4F]/10 border-[#50C878]/50 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]' 
                                                : 'bg-transparent border-transparent hover:bg-white/5'
                                            }
                                        `}
                                    >
                                        {/* Active Indicator Line */}
                                        {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#50C878]" />}

                                        <div className="flex gap-4">
                                            {/* Number/Icon */}
                                            <div className={`
                                                w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono transition-colors flex-shrink-0
                                                ${isActive ? 'bg-[#50C878] text-[#D1F2EB]' : 'bg-[#0B6E4F] text-yellow-400 group-hover:bg-gray-700 group-hover:text-[#D1F2EB]'}
                                            `}>
                                                {isVisited ? <CheckCircle size={14} /> : idx + 1}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <p className={`text-sm font-medium truncate ${isActive ? 'text-[#D1F2EB]' : 'text-[#D1F2EB]/70 group-hover:text-gray-200'}`}>
                                                        Class {idx + 1}
                                                    </p>
                                                    {isActive && <div className="w-2 h-2 rounded-full bg-[#50C878] animate-pulse flex-shrink-0" />}
                                                </div>
                                                
                                                {/* Meta Badges */}
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {cls.video && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0B6E4F] text-yellow-400 uppercase font-bold tracking-wider">
                                                            Video
                                                        </span>
                                                    )}
                                                    {cls.mcq?.length > 0 && (
                                                        <span className={`
                                                            text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider border
                                                            ${result 
                                                                ? (result.passed ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20") 
                                                                : "bg-[#0B6E4F] text-yellow-400 border-transparent"
                                                            }
                                                        `}>
                                                            {result ? (result.passed ? "Passed" : "Failed") : "Quiz"}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CourseLearning;