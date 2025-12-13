import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, Mic, FileText, CheckCircle, UploadCloud, 
  Plus, ArrowLeft, Save, LayoutList, AlertCircle, Check 
} from 'lucide-react';

// --- STYLED COMPONENTS ---

const GlassCard = ({ children, className = "" }) => (
  <div className={`
    relative overflow-hidden
    bg-gray-900/40 backdrop-blur-xl 
    border border-white/5 shadow-2xl
    rounded-2xl p-6 
    ${className}
  `}>
    {/* Inner decorative gradient */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
    {children}
  </div>
);

const ContentEditor = ({ courseData, setCourseData, onBack, onFinalSubmit }) => {
    const CLOUD_NAME = "dlzzvvz08"; 
    const UPLOAD_PRESET = "lms_project"; 

    const [activeClassIndex, setActiveClassIndex] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0); 
    
    const [tempVideoFile, setTempVideoFile] = useState(null);
    const [tempAudioFile, setTempAudioFile] = useState(null);

    const currentClass = courseData.classes[activeClassIndex];

    useEffect(() => {
        setTempVideoFile(null);
        setTempAudioFile(null);
        setProgress(0);
    }, [activeClassIndex]);

    const uploadToCloudinary = async (file, resourceType) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET); 
        
        try {
            const res = await axios.post(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, 
                formData,
                {
                    onUploadProgress: (data) => {
                        const percent = Math.round((data.loaded / data.total) * 100);
                        setProgress(percent);
                    }
                }
            );
            return res.data.secure_url;
        } catch (err) {
            console.error("Cloudinary Upload Error:", err);
            throw new Error("File upload failed");
        }
    };

    const handleTextChange = (val) => {
        const newClasses = [...courseData.classes];
        newClasses[activeClassIndex].text = val;
        setCourseData({ ...courseData, classes: newClasses });
    };

    const addMCQ = () => {
        const newClasses = [...courseData.classes];
        newClasses[activeClassIndex].mcq.push({ question: '', options: ['', '', '', ''], answer: '' });
        setCourseData({ ...courseData, classes: newClasses });
    };

    // --- UPDATED MCQ LOGIC (Auto-Sync Answer) ---
    const updateMCQ = (mcqIndex, field, value, optIndex = null) => {
        const newClasses = [...courseData.classes];
        const targetMCQ = newClasses[activeClassIndex].mcq[mcqIndex];

        if (field === 'options') {
            const oldOptionValue = targetMCQ.options[optIndex];
            targetMCQ.options[optIndex] = value;

            // FIX: If the edited option was the "Correct Answer", update the answer text too
            if (targetMCQ.answer === oldOptionValue) {
                targetMCQ.answer = value;
            }
        } else if (field === 'answer') {
             targetMCQ.answer = value;
        } else {
            targetMCQ[field] = value;
        }
        setCourseData({ ...courseData, classes: newClasses });
    };

    const handleSaveClass = async () => {
        if (!tempVideoFile && !currentClass.video) {
            alert("⚠️ A Video is mandatory for this class.");
            return;
        }

        setUploading(true);
        setProgress(0); 

        try {
            let videoUrl = currentClass.video;
            let audioUrl = currentClass.audio;

            if (tempVideoFile) {
                if (currentClass.video) {
                    await axios.post('http://localhost:5000/api/instructor/delete-media', {
                        url: currentClass.video,
                        resourceType: 'video'
                    });
                }
                videoUrl = await uploadToCloudinary(tempVideoFile, "video");
            }

            if (tempAudioFile) {
                setProgress(0); 
                if (currentClass.audio) {
                    await axios.post('http://localhost:5000/api/instructor/delete-media', {
                        url: currentClass.audio,
                        resourceType: 'video' 
                    });
                }
                audioUrl = await uploadToCloudinary(tempAudioFile, "video");
            }

            const newClasses = [...courseData.classes];
            newClasses[activeClassIndex].video = videoUrl;
            newClasses[activeClassIndex].audio = audioUrl;
            
            setCourseData({ ...courseData, classes: newClasses });
            
            setTempVideoFile(null);
            setTempAudioFile(null);
            alert(`Class ${activeClassIndex + 1} content updated!`);
        } catch (err) {
            console.error(err);
            alert("Upload/Cleanup failed: " + err.message);
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    const attemptFinalSubmit = () => {
        const incomplete = courseData.classes.findIndex(c => !c.video);
        if (incomplete !== -1) {
            alert(`⚠️ Class ${incomplete + 1} is missing a video! Please upload one.`);
            setActiveClassIndex(incomplete);
            return;
        }
        onFinalSubmit();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            
            {/* --- SIDEBAR: CLASS LIST --- */}
            <div className="lg:col-span-3 space-y-4">
                <GlassCard className="h-fit sticky top-4">
                    <div className="flex items-center gap-2 mb-6 text-indigo-400">
                        <LayoutList size={20} />
                        <h3 className="font-bold uppercase tracking-wider text-sm">Course Structure</h3>
                    </div>
                    
                    <div className="space-y-2 mb-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {courseData.classes.map((cls, idx) => (
                            <motion.div 
                                key={idx}
                                onClick={() => setActiveClassIndex(idx)}
                                whileHover={{ scale: 1.02, x: 5 }}
                                whileTap={{ scale: 0.98 }}
                                className={`
                                    p-4 rounded-xl cursor-pointer border transition-all duration-300 relative overflow-hidden group
                                    ${idx === activeClassIndex 
                                        ? 'bg-indigo-600/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
                                        : 'bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/10'
                                    }
                                `}
                            >
                                <div className="flex justify-between items-center relative z-10">
                                    <span className={`text-sm font-medium ${idx === activeClassIndex ? 'text-white' : 'text-gray-400'}`}>
                                        Class {idx + 1}
                                    </span>
                                    {cls.video ? (
                                        <CheckCircle size={16} className="text-green-400" />
                                    ) : (
                                        <div className="w-2 h-2 rounded-full bg-red-500/50" />
                                    )}
                                </div>
                                {/* Active Indicator Bar */}
                                {idx === activeClassIndex && (
                                    <motion.div 
                                        layoutId="active-bar"
                                        className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" 
                                    />
                                )}
                            </motion.div>
                        ))}
                    </div>

                    <div className="space-y-3 pt-4 border-t border-white/10">
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={attemptFinalSubmit} 
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold shadow-lg hover:shadow-green-500/30 transition-all flex items-center justify-center gap-2"
                        >
                            <Check size={18} />
                            Publish Course
                        </motion.button>
                        
                        <motion.button 
                            whileHover={{ x: -2 }}
                            onClick={onBack} 
                            className="w-full py-2 text-sm text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={16} />
                            Go Back
                        </motion.button>
                    </div>
                </GlassCard>
            </div>

            {/* --- MAIN: EDITOR --- */}
            <div className="lg:col-span-9">
                <GlassCard className="min-h-full">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 pb-4 border-b border-white/5 gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <span className="bg-indigo-500/20 text-indigo-400 p-2 rounded-lg"><LayoutList size={24}/></span>
                                Editing Class {activeClassIndex + 1}
                            </h2>
                            <p className="text-gray-400 text-sm mt-1 ml-12">Manage video lectures, audio notes, and assessments.</p>
                        </div>
                        {uploading && (
                             <div className="flex items-center gap-3 bg-gray-900/50 px-4 py-2 rounded-full border border-indigo-500/30">
                                <span className="text-xs font-mono text-indigo-400 animate-pulse">UPLOADING...</span>
                                <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                    <motion.div 
                                        className="h-full bg-indigo-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                    />
                                </div>
                             </div>
                        )}
                    </div>

                    {/* Media Uploads Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Video Upload Card */}
                        <div className="bg-black/20 p-5 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors group">
                            <label className="flex flex-col h-full cursor-pointer">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-xs tracking-wider">
                                        <Video size={16} />
                                        Primary Lecture
                                    </div>
                                    {currentClass.video && <CheckCircle size={16} className="text-green-500" />}
                                </div>
                                
                                <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-700 rounded-lg group-hover:border-indigo-500/50 group-hover:bg-indigo-500/5 transition-all">
                                    <UploadCloud size={32} className="text-gray-500 mb-2 group-hover:text-indigo-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm text-gray-400 text-center">
                                        {tempVideoFile ? tempVideoFile.name : (currentClass.video ? "Replace Video" : "Upload MP4/WebM")}
                                    </span>
                                </div>
                                <input 
                                    type="file" 
                                    accept="video/*" 
                                    className="hidden" 
                                    onChange={e => setTempVideoFile(e.target.files[0])} 
                                />
                            </label>
                            {currentClass.video && !tempVideoFile && (
                                <p className="text-xs text-gray-600 mt-2 truncate font-mono">Current: {currentClass.video.split('/').pop()}</p>
                            )}
                        </div>

                        {/* Audio Upload Card */}
                        <div className="bg-black/20 p-5 rounded-xl border border-white/5 hover:border-purple-500/30 transition-colors group">
                             <label className="flex flex-col h-full cursor-pointer">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2 text-purple-400 font-bold uppercase text-xs tracking-wider">
                                        <Mic size={16} />
                                        Audio Notes
                                    </div>
                                    {currentClass.audio && <CheckCircle size={16} className="text-green-500" />}
                                </div>
                                
                                <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-700 rounded-lg group-hover:border-purple-500/50 group-hover:bg-purple-500/5 transition-all">
                                    <UploadCloud size={32} className="text-gray-500 mb-2 group-hover:text-purple-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm text-gray-400 text-center">
                                        {tempAudioFile ? tempAudioFile.name : (currentClass.audio ? "Replace Audio" : "Upload MP3/WAV")}
                                    </span>
                                </div>
                                <input 
                                    type="file" 
                                    accept="audio/*" 
                                    className="hidden" 
                                    onChange={e => setTempAudioFile(e.target.files[0])} 
                                />
                            </label>
                             {currentClass.audio && !tempAudioFile && (
                                <p className="text-xs text-gray-600 mt-2 truncate font-mono">Current: {currentClass.audio.split('/').pop()}</p>
                            )}
                        </div>
                    </div>

                    {/* Text Content */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 text-gray-400 font-bold uppercase text-xs tracking-wider mb-3">
                            <FileText size={16} />
                            Reading Materials
                        </div>
                        <textarea 
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-gray-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all min-h-[120px] resize-y placeholder:text-gray-700"
                            value={currentClass.text || ''} 
                            onChange={e => handleTextChange(e.target.value)} 
                            placeholder="Add supplementary reading text or notes for students here..." 
                        />
                    </div>

                    {/* Save Action */}
                    <div className="flex justify-end border-b border-white/5 pb-8 mb-8">
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSaveClass} 
                            disabled={uploading}
                            className={`
                                px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2
                                ${uploading 
                                    ? 'bg-gray-700 cursor-not-allowed text-gray-400' 
                                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-indigo-500/30'
                                }
                            `}
                        >
                            <Save size={18} />
                            {uploading ? 'Processing...' : 'Save Class Content'}
                        </motion.button>
                    </div>

                    {/* --- MCQs SECTION --- */}
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <AlertCircle size={20} className="text-orange-400"/>
                                Quiz Assessment
                            </h3>
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={addMCQ} 
                                className="px-4 py-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition text-sm font-bold flex items-center gap-2"
                            >
                                <Plus size={16} />
                                Add Question
                            </motion.button>
                        </div>
                        
                        <div className="space-y-4">
                            <AnimatePresence>
                                {currentClass.mcq.map((q, i) => (
                                    <motion.div 
                                        key={i} 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-black/30 p-6 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-4 mb-4">
                                            <span className="text-gray-500 font-mono text-sm">Q{i+1}</span>
                                            <input 
                                                className="flex-1 bg-transparent border-b border-gray-700 focus:border-indigo-500 focus:outline-none text-white font-medium py-1 transition-colors placeholder:text-gray-600" 
                                                placeholder="Enter your question here..." 
                                                value={q.question} 
                                                onChange={e => updateMCQ(i, 'question', e.target.value)} 
                                            />
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-8">
                                            {q.options.map((opt, optIdx) => {
                                                const isSelected = opt !== '' && q.answer === opt;
                                                return (
                                                    <div key={optIdx} className="flex gap-3 items-center group">
                                                        {/* Custom Radio Button */}
                                                        <div 
                                                            onClick={() => updateMCQ(i, 'answer', opt)}
                                                            className={`
                                                                w-5 h-5 rounded-full border cursor-pointer flex items-center justify-center transition-all
                                                                ${isSelected 
                                                                    ? 'border-green-500 bg-green-500/20' 
                                                                    : 'border-gray-600 hover:border-gray-400 bg-transparent'
                                                                }
                                                            `}
                                                            title="Mark as Correct Answer"
                                                        >
                                                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-green-500" />}
                                                        </div>

                                                        <input 
                                                            className={`
                                                                flex-1 bg-gray-900/50 border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none transition-all
                                                                ${isSelected 
                                                                    ? 'border-green-500/50 bg-green-900/10' 
                                                                    : 'border-gray-700 focus:border-indigo-500'
                                                                }
                                                            `}
                                                            placeholder={`Option ${optIdx+1}`} 
                                                            value={opt} 
                                                            onChange={e => updateMCQ(i, 'options', e.target.value, optIdx)} 
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        
                                        {!q.answer && (
                                            <div className="mt-3 flex justify-end">
                                                <span className="text-xs text-orange-400/80 bg-orange-400/10 px-2 py-1 rounded">
                                                    ⚠️ Select the correct answer bubble
                                                </span>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {currentClass.mcq.length === 0 && (
                                <div className="text-center py-8 border-2 border-dashed border-gray-800 rounded-xl text-gray-600">
                                    No questions added yet.
                                </div>
                            )}
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default ContentEditor;