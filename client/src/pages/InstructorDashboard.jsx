import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ContentEditor from '../components/ContentEditor';

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [courses, setCourses] = useState([]);
  const user = JSON.parse(sessionStorage.getItem('user'));

  // --- WIZARD STATE ---
  const [step, setStep] = useState(1);
  const [isEditing, setIsEditing] = useState(false); // New Flag
  const [editingCourseId, setEditingCourseId] = useState(null); // ID of course being edited

  const [courseData, setCourseData] = useState({
    title: '', description: '', price: '', numClasses: 1, 
    classes: [] 
  });

  useEffect(() => {
    if (!user || user.role !== 'instructor') {
      navigate('/login'); 
      return;
    }
    fetchBalance();
    fetchCourses();
  }, []);

  const fetchBalance = async () => {
    if(!user.bankAccountId) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/bank/balance/${user.id}`);
      setBalance(res.data.balance);
    } catch (err) { console.error("Balance error", err); }
  };

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/instructor/my-courses/${user.id}`);
      setCourses(res.data);
    } catch (err) { console.error("Courses error", err); }
  };

  // --- DELETE HANDLER ---
  const handleDelete = async (courseId) => {
    if(!window.confirm("Are you sure? This will delete the course and PERMANENTLY delete all videos from Cloudinary.")) return;
    
    try {
        await axios.delete(`http://localhost:5000/api/instructor/delete/${courseId}`);
        alert("Course Deleted");
        fetchCourses();
    } catch (err) {
        alert("Delete failed: " + err.message);
    }
  };

  // --- EDIT HANDLER ---
  const handleEdit = (course) => {
    setCourseData({
        title: course.title,
        description: course.description,
        price: course.price,
        numClasses: course.classes.length,
        classes: course.classes
    });
    setEditingCourseId(course._id);
    setIsEditing(true);
    setStep(2); // Jump straight to content editor
  };

  // --- STEP 1: INITIALIZE ---
  const handleStep1Submit = (e) => {
    e.preventDefault();
    setCourseData(prev => {
        const currentClasses = prev.classes || [];
        let newClasses = [...currentClasses];

        if (prev.numClasses > currentClasses.length) {
            const extraNeeded = prev.numClasses - currentClasses.length;
            const extraClasses = Array.from({ length: extraNeeded }, () => ({
                 video: '', audio: '', text: '', mcq: []
            }));
            newClasses = [...newClasses, ...extraClasses];
        } else if (prev.numClasses < currentClasses.length) {
            newClasses = newClasses.slice(0, prev.numClasses);
        }
        return { ...prev, classes: newClasses };
    });
    setStep(2); 
  };

  // --- FINAL SUBMIT (Handles both Create and Update) ---
  const handleFinalSubmit = async () => {
      try {
        if (isEditing) {
            // Update Logic (We need a PUT route for this, or just re-upload logic)
            // For simplicity, we can delete the old and create new, OR create a specific update route.
            // Let's create a specific UPDATE route logic here or treat it as new for now (simplest for lab)
            // Ideally: await axios.put(...)
            
            // NOTE: For this lab, let's treat "Edit" as updating the existing ID.
            // You'll need to add a router.put('/update/:id') in backend similar to upload but with findByIdAndUpdate
            alert("Edit Mode: Ideally this updates the DB. For now, try Deleting and re-creating if deep editing is needed.");
        } else {
            await axios.post('http://localhost:5000/api/instructor/upload', {
                ...courseData,
                instructorId: user.id
            });
            alert("Course Submitted! Pending Admin Approval.");
        }
        
        // Reset
        setStep(1);
        setIsEditing(false);
        setEditingCourseId(null);
        setCourseData({ title: '', description: '', price: '', numClasses: 1, classes: [] });
        fetchCourses();
      } catch (err) {
          alert("Submission Failed: " + err.message);
      }
  };

  const cancelEdit = () => {
      setStep(1);
      setIsEditing(false);
      setEditingCourseId(null);
      setCourseData({ title: '', description: '', price: '', numClasses: 1, classes: [] });
  };

  return (
    <div className="max-w-6xl mx-auto mt-8">
      {/* HEADER */}
      <div className="bg-dark-800 p-8 rounded-xl shadow-glow mb-8 flex justify-between items-center border border-gray-700">
        <div>
          <h1 className="text-3xl font-bold text-white">Instructor Studio</h1>
          <p className="text-gray-400">Welcome, {user?.name}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400 uppercase tracking-widest">Wallet Balance</p>
          <p className="text-4xl font-mono text-accent-500 font-bold mt-2">${balance}</p>
        </div>
      </div>

      {/* --- STEP 1: METADATA FORM --- */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-dark-800 p-6 rounded-xl border border-gray-700">
                <h2 className="text-xl font-bold mb-6 text-white border-b border-gray-700 pb-2">Step 1: Course Info</h2>
                <form onSubmit={handleStep1Submit} className="space-y-4">
                    <div>
                        <label className="text-gray-400 text-sm mb-1 block">Course Title</label>
                        <input className="input-field" value={courseData.title} onChange={e => setCourseData({...courseData, title: e.target.value})} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="text-gray-400 text-sm mb-1 block">Price ($)</label>
                             <input className="input-field" type="number" value={courseData.price} onChange={e => setCourseData({...courseData, price: e.target.value})} required />
                        </div>
                        <div>
                             <label className="text-gray-400 text-sm mb-1 block">Number of Classes</label>
                             <input className="input-field" type="number" min="1" max="50" value={courseData.numClasses} onChange={e => setCourseData({...courseData, numClasses: parseInt(e.target.value) || 1})} required />
                        </div>
                    </div>
                    <div>
                        <label className="text-gray-400 text-sm mb-1 block">Description</label>
                        <textarea className="input-field h-32" value={courseData.description} onChange={e => setCourseData({...courseData, description: e.target.value})} required />
                    </div>
                    <button className="btn-primary w-full mt-4">Next: Add Content →</button>
                </form>
            </div>

            {/* SIDEBAR WITH EDIT/DELETE */}
            <div className="bg-dark-800 p-6 rounded-xl border border-gray-700">
                <h2 className="text-xl font-bold mb-6 text-white border-b border-gray-700 pb-2">My Uploaded Courses</h2>
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {courses.length === 0 ? <p className="text-gray-500">No courses yet.</p> : courses.map(c => (
                        <div key={c._id} className="p-4 bg-dark-900 rounded border border-gray-800">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-white font-bold">{c.title}</span>
                                <span className={`text-xs px-2 py-1 rounded ${c.status === 'approved' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>{c.status}</span>
                            </div>
                            
                            {/* ACTION BUTTONS (Only for Pending) */}
                            {c.status === 'pending' && (
                                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-800">
                                    <button 
                                        onClick={() => handleEdit(c)}
                                        className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(c._id)}
                                        className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* --- STEP 2: CONTENT EDITOR --- */}
      {step === 2 && (
          <ContentEditor 
            courseData={courseData} 
            setCourseData={setCourseData} 
            onBack={cancelEdit} 
            onFinalSubmit={handleFinalSubmit}
          />
      )}
    </div>
  );
};

export default InstructorDashboard;