import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const CourseLearning = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [activeClassIndex, setActiveClassIndex] = useState(0);
    
    // MCQ State: stores { questionIndex: { selected: 'Option Text', isCorrect: true/false } }
    const [mcqState, setMcqState] = useState({}); 

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/learner/course/${courseId}`);
                setCourse(res.data);
            } catch (err) {
                alert("Failed to load course");
                navigate('/courses');
            }
        };
        fetchCourse();
    }, [courseId, navigate]);

    // Reset MCQ state when switching classes
    useEffect(() => {
        setMcqState({});
    }, [activeClassIndex]);

    if (!course) return <div className="text-white text-center mt-20 animate-pulse">Loading Class Room...</div>;

    const currentClass = course.classes[activeClassIndex];

    // Handle MCQ Click
    const handleOptionClick = (qIndex, option, correctAnswer) => {
        if (mcqState[qIndex]) return; // Prevent changing answer once selected

        setMcqState(prev => ({
            ...prev,
            [qIndex]: {
                selected: option,
                isCorrect: option === correctAnswer,
                correctAnswer: correctAnswer
            }
        }));
    };

    // Determine Button Style based on state
    const getOptionClass = (qIndex, option) => {
        const state = mcqState[qIndex];
        if (!state) return "bg-dark-800 hover:bg-dark-700 border-gray-700 text-gray-300"; // Default

        if (state.correctAnswer === option) return "bg-green-900/50 border-green-500 text-green-400 font-bold"; // Show Correct
        if (state.selected === option && !state.isCorrect) return "bg-red-900/50 border-red-500 text-red-400"; // Show Wrong selection

        return "bg-dark-800 opacity-40 border-transparent"; // Dim others
    };

    return (
        <div className="max-w-7xl mx-auto mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
            
            {/* LEFT COLUMN: Content (Scrollable) */}
            <div className="lg:col-span-2 overflow-y-auto pr-2 custom-scrollbar pb-20">
                
                {/* 1. Video Player */}
                <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl mb-6 border border-gray-800">
                    <video
                        key={currentClass.video} // Forces reload on class change
                        src={currentClass.video}
                        controls
                        controlsList="nodownload"
                        className="w-full h-full object-contain"
                        preload="auto"
                    />
                </div>

                {/* 2. Text Content */}
                <div className="bg-dark-800 p-8 rounded-xl border border-gray-700 mb-6 shadow-lg">
                    <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-2">📖 Lesson Notes</h2>
                    <div className="text-gray-300 whitespace-pre-wrap leading-relaxed text-lg">
                        {currentClass.text || <span className="text-gray-600 italic">No additional reading notes for this lesson.</span>}
                    </div>
                </div>

                {/* 3. Interactive MCQs */}
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
                                                disabled={!!mcqState[qIdx]}
                                                className={`p-4 text-left rounded-lg border transition-all duration-200 flex justify-between items-center ${getOptionClass(qIdx, opt)}`}
                                            >
                                                <span>{opt}</span>
                                                {/* Status Icons */}
                                                {mcqState[qIdx]?.correctAnswer === opt && <span className="text-xl">✅</span>}
                                                {mcqState[qIdx]?.selected === opt && !mcqState[qIdx].isCorrect && <span className="text-xl">❌</span>}
                                            </button>
                                        ))}
                                    </div>
                                    {/* Result Message */}
                                    {mcqState[qIdx] && (
                                        <div className={`mt-3 text-sm font-bold ${mcqState[qIdx].isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                                            {mcqState[qIdx].isCorrect ? "Correct! 🎉" : "Incorrect. See correct answer above."}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT COLUMN: Playlist (Fixed Height) */}
            <div className="bg-dark-800 rounded-xl border border-gray-700 h-fit max-h-full flex flex-col shadow-xl overflow-hidden sticky top-4">
                <div className="p-5 border-b border-gray-700 bg-dark-900/80 backdrop-blur-sm">
                    <h3 className="font-bold text-white text-lg line-clamp-1" title={course.title}>{course.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{course.classes.length} Lessons • {course.instructorId?.name}</p>
                </div>
                
                <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                    {course.classes.map((cls, idx) => (
                        <div
                            key={idx}
                            onClick={() => setActiveClassIndex(idx)}
                            className={`p-4 rounded-lg cursor-pointer transition flex items-start gap-4 group ${
                                idx === activeClassIndex
                                    ? 'bg-accent-500 text-white shadow-md transform scale-[1.02]'
                                    : 'hover:bg-dark-700 text-gray-400 hover:text-white'
                            }`}
                        >
                            <div className={`flex items-center justify-center min-w-[28px] h-[28px] rounded-full text-xs font-bold mt-0.5 ${
                                idx === activeClassIndex ? 'bg-white text-accent-500' : 'bg-dark-900 text-gray-500 group-hover:bg-gray-700'
                            }`}>
                                {idx === activeClassIndex ? '▶' : idx + 1}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold line-clamp-2">Class {idx + 1}</p>
                                <div className="flex gap-2 text-[10px] uppercase tracking-wider opacity-70 mt-2 font-medium">
                                    {cls.video && <span className="flex items-center gap-1">📹 Video</span>}
                                    {cls.text && <span className="flex items-center gap-1">📄 Text</span>}
                                    {cls.mcq?.length > 0 && <span className="flex items-center gap-1">❓ Quiz</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default CourseLearning;