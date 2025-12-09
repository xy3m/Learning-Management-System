import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

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

    // --- FIX 1: Split the Effects ---
    
    // Effect A: Reset Quiz ONLY when switching classes (Not when course updates)
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
        } catch (err) { alert("Failed to load data"); }
    };

    const markClassVisited = async (idx) => {
        // Optimistic UI Update
        if (!progressData.completedClassIndices.includes(idx)) {
            const newIndices = [...progressData.completedClassIndices, idx];
            setProgressData(prev => ({ ...prev, completedClassIndices: newIndices }));
            
            // API Call
            await axios.post('http://localhost:5000/api/learner/progress', {
                learnerId: user.id,
                courseId,
                classIndex: idx
            });
        }
    };

    // --- LOGIC: QUIZ ---
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

        // Check if all questions are answered
        if (Object.keys(mcqState).length < totalQuestions) {
            alert("Please answer all questions before submitting.");
            return;
        }

        currentClass.mcq.forEach((q, idx) => {
            if (mcqState[idx]?.isCorrect) correctCount++;
        });

        const scorePercent = (correctCount / totalQuestions) * 100;
        const passed = scorePercent >= 50;

        setQuizSubmitted(true); // Show Green/Red results

        // Update Backend
        await axios.post('http://localhost:5000/api/learner/submit-quiz', {
            learnerId: user.id,
            courseId,
            classIndex: activeClassIndex,
            score: scorePercent,
            passed
        });

        // This will now update progress WITHOUT resetting the quiz view
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

    // Helper for Option Styling
    const getOptionStyle = (qIdx, opt) => {
        const selection = mcqState[qIdx];
        const isSelected = selection?.selected === opt;

        // 1. If NOT submitted yet: Show Blue if selected, Gray otherwise
        if (!quizSubmitted) {
            return isSelected 
                ? "bg-accent-500/20 border-accent-500 text-white shadow-glow" 
                : "bg-dark-800 border-gray-700 hover:bg-dark-700 text-gray-300";
        }

        // 2. If Submitted: Show Results
        if (isSelected) {
            return selection.isCorrect 
                ? "bg-green-900/50 border-green-500 text-green-400 font-bold" // Selected & Right
                : "bg-red-900/50 border-red-500 text-red-400"; // Selected & Wrong
        }
        
        // Show correct answer if user picked wrong one
        if (selection && !selection.isCorrect && opt === selection.correctAnswer) {
             return "bg-green-900/20 border-green-500/50 text-green-400 opacity-70";
        }

        return "bg-dark-800 border-gray-700 opacity-50"; // Unselected options
    };

    if (!course) return <div className="text-white text-center mt-20 animate-pulse">Loading Class Room...</div>;

    const currentClass = course.classes[activeClassIndex];
    const progressPercent = Math.round((progressData.completedClassIndices.length / course.classes.length) * 100);

    return (
        <div className="max-w-7xl mx-auto mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
            
            {/* LEFT COLUMN: Content */}
            <div className="lg:col-span-2 overflow-y-auto pr-2 custom-scrollbar pb-20">
                
                {/* VIDEO */}
                <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl mb-4 border border-gray-800">
                    <video
                        key={`vid-${currentClass.video}`} 
                        src={currentClass.video}
                        controls
                        controlsList="nodownload"
                        className="w-full h-full object-contain"
                        preload="auto"
                    />
                </div>

                {/* AUDIO */}
                <div className="bg-dark-800 p-4 rounded-xl border border-gray-700 mb-6 flex items-center gap-4">
                    <span className="text-sm font-bold text-gray-400 uppercase">🎧 Audio Lesson</span>
                    {currentClass.audio ? (
                        <audio 
                            key={`aud-${currentClass.audio}`}
                            src={currentClass.audio} 
                            controls 
                            className="w-full h-10" 
                        />
                    ) : <span className="text-gray-600 text-sm italic">No audio available</span>}
                </div>

                {/* TEXT */}
                <div className="bg-dark-800 p-8 rounded-xl border border-gray-700 mb-6 shadow-lg">
                    <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-2">📖 Lesson Notes</h2>
                    <div className="text-gray-300 whitespace-pre-wrap leading-relaxed text-lg">
                        {currentClass.text || <span className="text-gray-600 italic">No notes.</span>}
                    </div>
                </div>

                {/* MCQs */}
                {currentClass.mcq && currentClass.mcq.length > 0 && (
                    <div className="bg-dark-800 p-8 rounded-xl border border-gray-700 shadow-lg">
                        <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-2">🧠 Knowledge Check</h2>
                        <div className="space-y-8">
                            {currentClass.mcq.map((q, qIdx) => (
                                <div key={qIdx} className="p-4 rounded-lg bg-dark-900/50 border border-gray-800">
                                    <p className="text-white font-medium text-lg mb-4"><span className="text-accent-500 mr-2">{qIdx + 1}.</span> {q.question}</p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {q.options.map((opt, oIdx) => (
                                            <button
                                                key={oIdx}
                                                onClick={() => handleOptionClick(qIdx, opt, q.answer)}
                                                disabled={quizSubmitted}
                                                className={`p-4 text-left rounded-lg border transition-all duration-200 flex justify-between items-center ${getOptionStyle(qIdx, opt)}`}
                                            >
                                                <span>{opt}</span>
                                                {/* ONLY SHOW ICONS IF SUBMITTED */}
                                                {quizSubmitted && mcqState[qIdx]?.selected === opt && (
                                                    <span className="text-xl">{mcqState[qIdx].isCorrect ? '✅' : '❌'}</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {!quizSubmitted ? (
                            <button onClick={submitQuiz} className="mt-6 w-full py-3 bg-accent-500 hover:bg-indigo-600 text-white font-bold rounded-lg transition shadow-glow">
                                Submit Answers
                            </button>
                        ) : (
                            <div className="mt-6 text-center p-4 bg-dark-900 rounded-lg border border-gray-700">
                                <p className="text-gray-400 text-sm">
                                    Result submitted. 
                                    <span className="text-white font-bold ml-2">
                                        Check Playlist for status.
                                    </span>
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* RIGHT COLUMN: Playlist & Progress */}
            <div className="flex flex-col gap-4 sticky top-4 h-fit">
                
                {/* PROGRESS BAR */}
                <div className="bg-dark-800 p-6 rounded-xl border border-gray-700 shadow-xl">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-white font-bold">Course Progress</span>
                        <span className="text-accent-500 font-bold">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-dark-900 rounded-full h-3 overflow-hidden border border-gray-800">
                        <div className="bg-gradient-to-r from-accent-500 to-purple-500 h-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    
                    {/* CERTIFICATE BUTTON */}
                    {isCertificateReady() ? (
                        <button onClick={downloadCertificate} className="mt-6 w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-glow animate-pulse">
                            🎓 Download Certificate
                        </button>
                    ) : (
                        <p className="text-xs text-gray-500 mt-3 text-center">
                            Complete all classes & pass quizzes ({'>'}50%) to unlock certificate.
                        </p>
                    )}
                </div>

                {/* PLAYLIST */}
                <div className="bg-dark-800 rounded-xl border border-gray-700 flex flex-col shadow-xl overflow-hidden max-h-[60vh]">
                    <div className="p-5 border-b border-gray-700 bg-dark-900/80 backdrop-blur-sm">
                        <h3 className="font-bold text-white text-lg line-clamp-1">{course.title}</h3>
                        <p className="text-sm text-gray-400 mt-1">{course.classes.length} Lessons • {course.instructorId?.name}</p>
                    </div>
                    
                    <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                        {course.classes.map((cls, idx) => {
                            // Check Quiz Status
                            const result = progressData.quizResults.find(r => r.classIndex === idx);
                            const isVisited = progressData.completedClassIndices.includes(idx);

                            return (
                                <div
                                    key={idx}
                                    onClick={() => setActiveClassIndex(idx)}
                                    className={`p-4 rounded-lg cursor-pointer transition flex items-start gap-4 group ${
                                        idx === activeClassIndex
                                            ? 'bg-accent-500 text-white shadow-md'
                                            : 'hover:bg-dark-700 text-gray-400 hover:text-white'
                                    }`}
                                >
                                    <div className={`flex items-center justify-center min-w-[28px] h-[28px] rounded-full text-xs font-bold mt-0.5 ${
                                        idx === activeClassIndex ? 'bg-white text-accent-500' : 'bg-dark-900 text-gray-500'
                                    }`}>
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold line-clamp-2">Class {idx + 1}</p>
                                        <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wider opacity-70 mt-2 font-medium">
                                            {cls.video && <span>📹 Video</span>}
                                            {cls.mcq?.length > 0 && (
                                                <span className={result ? (result.passed ? "text-green-300" : "text-red-300") : ""}>
                                                    {result ? (result.passed ? "✅ Passed" : "❌ Failed") : "❓ Quiz"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {isVisited && <span className="text-green-400 text-xs">✔</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default CourseLearning;