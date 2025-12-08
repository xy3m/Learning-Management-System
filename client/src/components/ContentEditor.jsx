import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ContentEditor = ({ courseData, setCourseData, onBack, onFinalSubmit }) => {
    // Cloudinary Config 
    const CLOUD_NAME = "dlzzvvz08"; 
    const UPLOAD_PRESET = "lms_project"; 

    const [activeClassIndex, setActiveClassIndex] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0); // <--- NEW: Progress State
    
    // Temporary file holders for the ACTIVE class
    const [tempVideoFile, setTempVideoFile] = useState(null);
    const [tempAudioFile, setTempAudioFile] = useState(null);

    // Get current class data
    const currentClass = courseData.classes[activeClassIndex];

    // RESET TEMP FILES WHEN SWITCHING CLASSES
    useEffect(() => {
        setTempVideoFile(null);
        setTempAudioFile(null);
        setProgress(0);
    }, [activeClassIndex]);

    // Helper function to upload file with PROGRESS
    const uploadToCloudinary = async (file, resourceType) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET); 
        
        try {
            const res = await axios.post(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, 
                formData,
                {
                    // Axios event listener for upload progress
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

    // --- MCQ LOGIC ---
    const addMCQ = () => {
        const newClasses = [...courseData.classes];
        newClasses[activeClassIndex].mcq.push({ question: '', options: ['', '', '', ''], answer: '' });
        setCourseData({ ...courseData, classes: newClasses });
    };

    const updateMCQ = (mcqIndex, field, value, optIndex = null) => {
        const newClasses = [...courseData.classes];
        const targetMCQ = newClasses[activeClassIndex].mcq[mcqIndex];

        if (field === 'options') {
            targetMCQ.options[optIndex] = value;
        } else {
            targetMCQ[field] = value;
        }
        setCourseData({ ...courseData, classes: newClasses });
    };

    const handleSaveClass = async () => {
        // Validation
        if (!tempVideoFile && !currentClass.video) {
            alert("⚠️ A Video is mandatory for this class.");
            return;
        }

        setUploading(true);
        setProgress(0); // Reset progress start

        try {
            let videoUrl = currentClass.video;
            let audioUrl = currentClass.audio;

            // 1. Handle Video Replacement
            if (tempVideoFile) {
                if (currentClass.video) {
                    await axios.post('http://localhost:5000/api/instructor/delete-media', {
                        url: currentClass.video,
                        resourceType: 'video'
                    });
                }
                // Upload NEW video
                videoUrl = await uploadToCloudinary(tempVideoFile, "video");
            }

            // 2. Handle Audio Replacement
            if (tempAudioFile) {
                // Reset progress for next file
                setProgress(0); 
                
                if (currentClass.audio) {
                    await axios.post('http://localhost:5000/api/instructor/delete-media', {
                        url: currentClass.audio,
                        resourceType: 'video' 
                    });
                }
                // Upload NEW audio
                audioUrl = await uploadToCloudinary(tempAudioFile, "video");
            }

            // 3. Update State
            const newClasses = [...courseData.classes];
            newClasses[activeClassIndex].video = videoUrl;
            newClasses[activeClassIndex].audio = audioUrl;
            
            setCourseData({ ...courseData, classes: newClasses });
            
            // cleanup temp files
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* SIDEBAR */}
            <div className="bg-dark-800 p-4 rounded-xl border border-gray-700 h-fit">
                <h3 className="text-lg font-bold text-white mb-4">Class List</h3>
                <div className="space-y-2 mb-6">
                    {courseData.classes.map((cls, idx) => (
                        <div 
                            key={idx}
                            onClick={() => setActiveClassIndex(idx)}
                            className={`p-3 rounded cursor-pointer border transition flex justify-between items-center
                                ${idx === activeClassIndex ? 'bg-accent-500 border-accent-500 text-white' : 'bg-dark-700 border-gray-700 text-gray-400 hover:border-gray-500'}
                            `}
                        >
                            <span>Class {idx + 1}</span>
                            {cls.video ? <span className="text-green-300 font-bold">✓</span> : <span className="text-red-400 text-xs">Empty</span>}
                        </div>
                    ))}
                </div>
                <button onClick={onBack} className="w-full py-2 border border-gray-500 text-gray-400 rounded hover:text-white mb-2">Back</button>
                <button onClick={attemptFinalSubmit} className="btn-primary w-full bg-green-600 hover:bg-green-500">Submit Course</button>
            </div>

            {/* MAIN EDITOR */}
            <div className="md:col-span-2 bg-dark-800 p-6 rounded-xl border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">
                    Editing: Class {activeClassIndex + 1}
                </h2>

                {/* Media Uploads */}
                <div className="space-y-4 mb-6">
                    <div className="bg-dark-700 p-4 rounded-lg">
                        <label className="text-accent-500 text-sm font-bold uppercase mb-2 block">1. Video (Mandatory)</label>
                        {currentClass.video && <p className="text-green-400 text-xs mb-2 truncate">✓ Saved: {currentClass.video.split('/').pop()}</p>}
                        
                        <input 
                            key={`video-${activeClassIndex}`} 
                            type="file" 
                            accept="video/*" 
                            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-accent-500 file:text-white hover:file:bg-indigo-600"
                            onChange={e => setTempVideoFile(e.target.files[0])} 
                        />
                    </div>

                    <div className="bg-dark-700 p-4 rounded-lg">
                        <label className="text-accent-500 text-sm font-bold uppercase mb-2 block">2. Audio (Optional)</label>
                        {currentClass.audio && <p className="text-green-400 text-xs mb-2 truncate">✓ Saved: {currentClass.audio.split('/').pop()}</p>}
                        
                        <input 
                            key={`audio-${activeClassIndex}`} 
                            type="file" 
                            accept="audio/*" 
                            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-accent-500 file:text-white hover:file:bg-indigo-600"
                            onChange={e => setTempAudioFile(e.target.files[0])} 
                        />
                    </div>
                </div>

                <div className="mb-6">
                    <label className="text-gray-400 text-sm mb-1 block">Text Content (Optional)</label>
                    <textarea className="input-field h-24" value={currentClass.text || ''} onChange={e => handleTextChange(e.target.value)} placeholder="Enter reading materials here..." />
                </div>
                
                <div className="flex flex-col items-end gap-3">
                     {/* PROGRESS BAR */}
                     {uploading && (
                        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden border border-gray-600">
                            <div 
                                className="bg-accent-500 h-4 rounded-full transition-all duration-300 ease-out flex items-center justify-center text-[10px] font-bold text-white"
                                style={{ width: `${progress}%` }}
                            >
                                {progress}%
                            </div>
                        </div>
                     )}

                     <button 
                        onClick={handleSaveClass} 
                        disabled={uploading}
                        className={`px-6 py-2 rounded font-bold text-white transition ${uploading ? 'bg-gray-600 cursor-not-allowed' : 'bg-accent-500 hover:bg-indigo-600'}`}
                     >
                        {uploading ? 'Uploading...' : 'Save Class Content'}
                     </button>
                </div>

                {/* MCQs (Optional) */}
                <div className="mt-8 border-t border-gray-700 pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-white font-bold">MCQs (Optional)</h3>
                        <button onClick={addMCQ} className="text-xs border border-green-500 text-green-500 px-3 py-1 rounded hover:bg-green-500 hover:text-white">+ Add Question</button>
                    </div>
                    
                    {currentClass.mcq.map((q, i) => (
                        <div key={i} className="bg-dark-900 p-4 rounded mb-4 border border-gray-800">
                            <input className="input-field mb-2" placeholder={`Question ${i+1}`} value={q.question} onChange={e => updateMCQ(i, 'question', e.target.value)} />
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                {q.options.map((opt, optIdx) => (
                                    <input key={optIdx} className="input-field" placeholder={`Option ${optIdx+1}`} value={opt} onChange={e => updateMCQ(i, 'options', e.target.value, optIdx)} />
                                ))}
                            </div>
                            <input className="input-field" placeholder="Correct Answer" value={q.answer} onChange={e => updateMCQ(i, 'answer', e.target.value)} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ContentEditor;