import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, Mic, FileText, CheckCircle, UploadCloud, 
  Plus, ArrowLeft, Save, LayoutList, AlertCircle, Check, X, Loader2 
} from 'lucide-react';
import toast from 'react-hot-toast';

// --- STYLED COMPONENTS ---

const GlassCard = ({ children, className = "" }) => (
  <div className={`
    relative overflow-hidden
    bg-[#0f1116] border border-gray-800 shadow-2xl
    rounded-3xl p-6 
    ${className}
  `}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
    {children}
  </div>
);

const ContentEditor = ({ courseData, setCourseData, onBack, onFinalSubmit }) => {
    const CLOUD_NAME = "dlzzvvz08"; 
    const UPLOAD_PRESET = "lms_project"; 

    const [activeClassIndex, setActiveClassIndex] = useState(0);
    
    // FIX: Track upload status PER CLASS index
    // Structure: { 0: { uploading: true, progress: 45 }, 1: { uploading: false, progress: 0 } }
    const [uploadStatus, setUploadStatus] = useState({}); 

    const [tempVideoFile, setTempVideoFile] = useState(null);
    const [tempAudioFile, setTempAudioFile] = useState(null);

    const currentClass = courseData.classes[activeClassIndex];
    const currentUpload = uploadStatus[activeClassIndex] || { uploading: false, progress: 0 };

    useEffect(() => {
        // Only reset temp files when switching tabs, NOT the upload progress
        setTempVideoFile(null);
        setTempAudioFile(null);
    }, [activeClassIndex]);

    // --- UPLOAD LOGIC ---
    const uploadToCloudinary = async (file, resourceType, classIdx) => {
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
                        // Update specific class progress
                        setUploadStatus(prev => ({
                            ...prev,
                            [classIdx]: { uploading: true, progress: percent }
                        }));
                    }
                }
            );
            return res.data.secure_url;
        } catch (err) {
            console.error("Cloudinary Upload Error:", err);
            throw new Error("File upload failed");
        }
    };

    // --- HANDLERS ---
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

    const removeMCQ = (index) => {
        const newClasses = [...courseData.classes];
        newClasses[activeClassIndex].mcq.splice(index, 1);
        setCourseData({ ...courseData, classes: newClasses });
    };

    const updateMCQ = (mcqIndex, field, value, optIndex = null) => {
        const newClasses = [...courseData.classes];
        const targetMCQ = newClasses[activeClassIndex].mcq[mcqIndex];

        if (field === 'options') {
            const oldOptionValue = targetMCQ.options[optIndex];
            targetMCQ.options[optIndex] = value;
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

    // --- SAVE LOGIC ---
    const handleSaveClass = async () => {
        const targetIdx = activeClassIndex; // Capture index at start of save

        if (!tempVideoFile && !currentClass.video) {
            toast.error("A Video is mandatory for this class.");
            return;
        }

        // Init upload state for this class
        setUploadStatus(prev => ({ ...prev, [targetIdx]: { uploading: true, progress: 0 } }));

        try {
            let videoUrl = currentClass.video;
            let audioUrl = currentClass.audio;

            if (tempVideoFile) {
                videoUrl = await uploadToCloudinary(tempVideoFile, "video", targetIdx);
            }

            if (tempAudioFile) {
                audioUrl = await uploadToCloudinary(tempAudioFile, "video", targetIdx);
            }

            const newClasses = [...courseData.classes];
            newClasses[targetIdx].video = videoUrl;
            newClasses[targetIdx].audio = audioUrl;
            
            setCourseData({ ...courseData, classes: newClasses });
            setTempVideoFile(null);
            setTempAudioFile(null);
            toast.success(`Class ${targetIdx + 1} saved successfully!`);

        } catch (err) {
            console.error(err);
            toast.error("Upload failed. Please try again.");
        } finally {
            // Clear upload state for this class
            setUploadStatus(prev => ({ ...prev, [targetIdx]: { uploading: false, progress: 0 } }));
        }
    };

    const attemptFinalSubmit = () => {
        // Check if any uploads are still running
        const isAnyUploading = Object.values(uploadStatus).some(status => status.uploading);
        if (isAnyUploading) {
            toast.error("Please wait for all uploads to finish.");
            return;
        }

        const incomplete = courseData.classes.findIndex(c => !c.video);
        if (incomplete !== -1) {
            toast.error(`Class ${incomplete + 1} is missing a video!`);
            setActiveClassIndex(incomplete);
            return;
        }
        onFinalSubmit();
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-full">
            
            {/* --- SIDEBAR: CLASS LIST --- */}
            <div className="xl:col-span-3 space-y-4">
                <GlassCard className="h-fit sticky top-32 border-gray-800">
                    <div className="flex items-center gap-2 mb-6 text-[#50C878]">
                        <LayoutList size={20} />
                        <h3 className="font-bold uppercase tracking-wider text-xs">Course Structure</h3>
                    </div>
                    
                    <div className="space-y-2 mb-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {courseData.classes.map((cls, idx) => {
                            // Check if this specific class is uploading
                            const isThisClassUploading = uploadStatus[idx]?.uploading;

                            return (
                                <motion.div 
                                    key={idx}
                                    onClick={() => setActiveClassIndex(idx)}
                                    whileHover={{ scale: 1.02, x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`
                                        p-4 rounded-xl cursor-pointer border transition-all duration-200 relative overflow-hidden group
                                        ${idx === activeClassIndex 
                                            ? 'bg-[#0B6E4F]/10 border-[#0B6E4F] text-[#D1F2EB] shadow-[0_0_20px_rgba(147,51,234,0.15)]' 
                                            : 'bg-[#18181b] border-gray-800 text-[#D1F2EB]/70 hover:border-gray-600 hover:text-gray-200'
                                        }
                                    `}
                                >
                                    <div className="flex justify-between items-center relative z-10">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg ${idx === activeClassIndex ? 'bg-[#0B6E4F] text-[#D1F2EB]' : 'bg-[#0B6E4F] text-gray-500'}`}>
                                                {idx + 1}
                                            </span>
                                            <span className="text-sm font-medium">Class {idx + 1}</span>
                                        </div>
                                        
                                        {/* Status Icon Logic */}
                                        {isThisClassUploading ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-[#50C878] font-mono">{uploadStatus[idx].progress}%</span>
                                                <Loader2 size={16} className="text-[#50C878] animate-spin" />
                                            </div>
                                        ) : cls.video ? (
                                            <CheckCircle size={16} className="text-green-500" />
                                        ) : (
                                            <div className="w-2 h-2 rounded-full bg-red-500/50" />
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    <div className="space-y-3 pt-6 border-t border-gray-800">
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={attemptFinalSubmit} 
                            className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-[#D1F2EB] font-bold shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            <Check size={18} />
                            Publish Course
                        </motion.button>
                        
                        <motion.button 
                            whileHover={{ x: -2 }}
                            onClick={onBack} 
                            className="w-full py-3 text-sm text-gray-500 hover:text-[#D1F2EB] border border-gray-700 hover:border-gray-500 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={16} />
                            Go Back
                        </motion.button>
                    </div>
                </GlassCard>
            </div>

            {/* --- MAIN: EDITOR --- */}
            <div className="xl:col-span-9">
                <GlassCard className="min-h-full border-gray-800">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                        <div>
                            <h2 className="text-3xl font-bold text-[#D1F2EB] flex items-center gap-3">
                                <span className="p-2 bg-[#0B6E4F]/20 rounded-lg text-[#50C878]"><Video size={24}/></span>
                                Editing Class {activeClassIndex + 1}
                            </h2>
                            <p className="text-[#D1F2EB]/70 text-sm mt-2 ml-1">Manage video lectures, audio notes, and assessments.</p>
                        </div>
                        
                        {/* --- PROGRESS BAR (Tracks Current Class Only) --- */}
                        <AnimatePresence>
                            {currentUpload.uploading && (
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="w-full md:w-72 bg-[#013220] rounded-xl border border-gray-700 p-4 shadow-xl"
                                >
                                    <div className="flex justify-between text-xs font-bold text-[#D1F2EB]/70 mb-2 uppercase tracking-wider">
                                        <span className="animate-pulse text-[#50C878]">Uploading...</span>
                                        <span className="text-[#D1F2EB]">{currentUpload.progress}%</span>
                                    </div>
                                    <div className="w-full h-3 bg-[#0B6E4F] rounded-full overflow-hidden border border-gray-700/50">
                                        <motion.div 
                                            className="h-full bg-gradient-to-r from-[#0B6E4F] to-[#50C878] relative"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${currentUpload.progress}%` }}
                                            transition={{ ease: "linear" }}
                                        >
                                            <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/50 blur-[4px]" />
                                        </motion.div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Media Uploads Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Video Upload Card */}
                        <div className="bg-[#18181b] p-6 rounded-2xl border border-gray-800 relative group hover:border-[#0B6E4F]/30 transition-all">
                            <label className="flex flex-col h-full cursor-pointer">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-[#D1F2EB]/90 flex items-center gap-2">
                                        <Video size={16} className="text-[#50C878]"/> Primary Lecture
                                    </h4>
                                    {currentClass.video && <CheckCircle size={16} className="text-green-500" />}
                                </div>
                                
                                <div className="relative w-full h-48 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center bg-[#013220]/20 group-hover:bg-[#0B6E4F]/5 group-hover:border-[#0B6E4F]/50 transition-all overflow-hidden">
                                    {tempVideoFile ? (
                                        <div className="text-center p-4">
                                            <div className="p-3 bg-[#0B6E4F]/20 rounded-full inline-block mb-2 text-[#50C878]"><Video size={24} /></div>
                                            <p className="text-sm text-[#D1F2EB] font-medium truncate w-48">{tempVideoFile.name}</p>
                                            <p className="text-xs text-gray-500 mt-1">Ready to upload</p>
                                        </div>
                                    ) : currentClass.video ? (
                                        <video src={currentClass.video} className="w-full h-full object-cover opacity-60" />
                                    ) : (
                                        <>
                                            <div className="p-4 bg-[#0B6E4F] rounded-full mb-3 group-hover:scale-110 transition-transform">
                                                <UploadCloud size={24} className="text-[#D1F2EB]/70 group-hover:text-[#50C878]"/>
                                            </div>
                                            <span className="text-sm text-gray-500 font-medium group-hover:text-purple-300">
                                                Click to Upload Video
                                            </span>
                                        </>
                                    )}
                                </div>
                                <input 
                                    type="file" 
                                    accept="video/*" 
                                    className="hidden" 
                                    onChange={e => setTempVideoFile(e.target.files[0])} 
                                />
                            </label>
                        </div>

                        {/* Audio Upload Card */}
                        <div className="bg-[#18181b] p-6 rounded-2xl border border-gray-800 relative group hover:border-[#0B6E4F]/30 transition-all">
                             <label className="flex flex-col h-full cursor-pointer">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-[#D1F2EB]/90 flex items-center gap-2">
                                        <Mic size={16} className="text-[#50C878]"/> Audio Notes
                                    </h4>
                                    {currentClass.audio && <CheckCircle size={16} className="text-green-500" />}
                                </div>
                                
                                <div className="relative w-full h-48 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center bg-[#013220]/20 group-hover:bg-[#0B6E4F]/5 group-hover:border-[#0B6E4F]/50 transition-all">
                                    {tempAudioFile ? (
                                        <div className="text-center p-4">
                                            <div className="p-3 bg-green-500/20 rounded-full inline-block mb-2 text-green-400"><Mic size={24} /></div>
                                            <p className="text-sm text-[#D1F2EB] font-medium truncate w-48">{tempAudioFile.name}</p>
                                            <p className="text-xs text-gray-500 mt-1">Ready to upload</p>
                                        </div>
                                    ) : currentClass.audio ? (
                                        <div className="text-center">
                                            <div className="p-4 bg-[#0B6E4F] rounded-full mb-3 inline-block">
                                                <Mic size={24} className="text-[#50C878]"/>
                                            </div>
                                            <p className="text-xs text-[#D1F2EB]/70 font-mono">Audio file active</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="p-4 bg-[#0B6E4F] rounded-full mb-3 group-hover:scale-110 transition-transform">
                                                <UploadCloud size={24} className="text-[#D1F2EB]/70 group-hover:text-[#50C878]"/>
                                            </div>
                                            <span className="text-sm text-gray-500 font-medium group-hover:text-purple-300">
                                                Upload Audio (Optional)
                                            </span>
                                        </>
                                    )}
                                </div>
                                <input 
                                    type="file" 
                                    accept="audio/*" 
                                    className="hidden" 
                                    onChange={e => setTempAudioFile(e.target.files[0])} 
                                />
                            </label>
                        </div>
                    </div>

                    {/* Text Content */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 text-[#D1F2EB]/70 font-bold uppercase text-xs tracking-wider mb-3">
                            <FileText size={16} />
                            Reading Materials
                        </div>
                        <textarea 
                            className="w-full bg-[#18181b] border border-gray-800 rounded-xl p-5 text-[#D1F2EB]/90 focus:outline-none focus:border-[#0B6E4F] focus:ring-1 focus:ring-[#0B6E4F] transition-all min-h-[150px] resize-y placeholder:text-gray-600"
                            value={currentClass.text || ''} 
                            onChange={e => handleTextChange(e.target.value)} 
                            placeholder="Add supplementary reading text or notes for students here..." 
                        />
                    </div>

                    {/* Save Action */}
                    <div className="flex justify-end border-b border-gray-800 pb-8 mb-8">
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSaveClass} 
                            disabled={currentUpload.uploading}
                            className={`
                                px-8 py-3 rounded-xl font-bold text-[#D1F2EB] shadow-lg transition-all flex items-center gap-2
                                ${currentUpload.uploading 
                                    ? 'bg-gray-700 cursor-not-allowed text-[#D1F2EB]/70' 
                                    : 'bg-gradient-to-r from-[#0B6E4F] to-[#0B6E4F] hover:shadow-[#0B6E4F]/30'
                                }
                            `}
                        >
                            <Save size={18} />
                            {currentUpload.uploading ? 'Processing...' : 'Save Class Content'}
                        </motion.button>
                    </div>

                    {/* --- MCQs SECTION --- */}
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-[#D1F2EB] flex items-center gap-2">
                                <AlertCircle size={20} className="text-orange-400"/>
                                Quiz Assessment
                            </h3>
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={addMCQ} 
                                className="px-4 py-2 rounded-lg border border-[#0B6E4F]/30 bg-[#0B6E4F]/10 text-[#50C878] hover:bg-[#0B6E4F]/20 transition text-sm font-bold flex items-center gap-2"
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
                                        className="bg-[#18181b] p-6 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors relative"
                                    >
                                        <button 
                                            onClick={() => removeMCQ(i)}
                                            className="absolute top-4 right-4 text-gray-600 hover:text-red-400 transition-colors"
                                        >
                                            <X size={18} />
                                        </button>

                                        <div className="flex items-center gap-4 mb-4">
                                            <span className="text-gray-500 font-mono text-sm font-bold">0{i+1}.</span>
                                            <input 
                                                className="flex-1 bg-transparent border-b border-gray-700 focus:border-[#0B6E4F] focus:outline-none text-[#D1F2EB] font-medium py-1 transition-colors placeholder:text-gray-600" 
                                                placeholder="Enter question text..." 
                                                value={q.question} 
                                                onChange={e => updateMCQ(i, 'question', e.target.value)} 
                                            />
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-8">
                                            {q.options.map((opt, optIdx) => {
                                                const isSelected = opt !== '' && q.answer === opt;
                                                return (
                                                    <div key={optIdx} className="flex gap-3 items-center group">
                                                        <div 
                                                            onClick={() => updateMCQ(i, 'answer', opt)}
                                                            className={`
                                                                w-5 h-5 rounded-full border cursor-pointer flex items-center justify-center transition-all
                                                                ${isSelected ? 'border-green-500 bg-green-500/20' : 'border-gray-600 hover:border-gray-400 bg-transparent'}
                                                            `}
                                                            title="Mark as Correct Answer"
                                                        >
                                                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-green-500" />}
                                                        </div>

                                                        <input 
                                                            className={`
                                                                flex-1 bg-[#013220]/30 border rounded-lg px-3 py-2 text-sm text-[#D1F2EB]/90 focus:outline-none transition-all
                                                                ${isSelected ? 'border-green-500/50 bg-green-900/10' : 'border-gray-700 focus:border-[#0B6E4F]'}
                                                            `}
                                                            placeholder={`Option ${optIdx+1}`} 
                                                            value={opt} 
                                                            onChange={e => updateMCQ(i, 'options', e.target.value, optIdx)} 
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default ContentEditor;