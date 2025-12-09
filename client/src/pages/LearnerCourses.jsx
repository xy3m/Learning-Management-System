import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LearnerCourses = () => {
  const [courses, setCourses] = useState([]);
  const [myTransactions, setMyTransactions] = useState([]); 
  const [myProgress, setMyProgress] = useState([]); // <--- NEW STATE
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- Modal States ---
  const [showPayModal, setShowPayModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null); 

  const user = JSON.parse(sessionStorage.getItem('user'));

  useEffect(() => {
    fetchApprovedCourses();
    if (user) {
        fetchMyStatus();
        fetchMyProgress(); // <--- Fetch Progress
    }
  }, []);

  const fetchApprovedCourses = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/learner/available-courses');
      setCourses(res.data);
    } catch (err) {
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyStatus = async () => {
    try {
        const res = await axios.get(`http://localhost:5000/api/learner/my-status/${user.id}`);
        setMyTransactions(res.data);
    } catch(err) { console.error(err); }
  };

  // --- NEW: Fetch Progress ---
  const fetchMyProgress = async () => {
    try {
        const res = await axios.get(`http://localhost:5000/api/learner/my-progress/${user.id}`);
        setMyProgress(res.data);
    } catch (err) { console.error(err); }
  };

  const initiateBuy = (courseId, price) => {
      if(!user) return alert("Please login first");
      setSelectedCourse({ id: courseId, price });
      setPinInput('');
      setShowPayModal(true);
  };

  const confirmPurchase = async (e) => {
      e.preventDefault();
      if(!pinInput) return alert("Please enter your PIN");

      try {
          await axios.post('http://localhost:5000/api/learner/buy', {
              learnerId: user.id,
              courseId: selectedCourse.id,
              learnerSecret: pinInput 
          });
          alert("✅ Order Placed! Money deducted. Waiting for Admin Approval.");
          setShowPayModal(false);
          fetchMyStatus(); 
      } catch (err) {
          alert("❌ Purchase Failed: " + (err.response?.data?.message || err.message));
      }
  };

  const handleStartLearning = (courseId) => {
      navigate(`/learning/${courseId}`);
  };

  // --- UPDATED LOGIC FOR BUTTON STATUS ---
  const getButtonState = (course) => {
      const courseId = course._id;

      // 1. Check if Course is COMPLETED
      const progress = myProgress.find(p => p.courseId === courseId);
      if (progress) {
          const totalClasses = course.classes.length;
          const visitedCount = progress.completedClassIndices.length;
          
          const classesWithQuiz = course.classes.filter(c => c.mcq && c.mcq.length > 0).length;
          // Count unique passed quizzes
          const passedQuizzes = new Set(progress.quizResults.filter(q => q.passed).map(q => q.classIndex)).size;
          
          const isFinished = visitedCount >= totalClasses && passedQuizzes >= classesWithQuiz;
          
          if (isFinished) return 'course_completed';
      }

      // 2. Check Transaction Status
      const courseTxs = myTransactions.filter(t => t.courseId === courseId);
      
      if (courseTxs.some(t => t.status === 'completed')) return 'owned';
      if (courseTxs.some(t => t.status.includes('pending'))) return 'pending';
      if (courseTxs.some(t => t.status.includes('declined'))) return 'declined';
      
      return 'buy';
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 relative">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Available Courses</h1>
        {user && (
            <div className="text-right">
                <span className="text-gray-400 text-sm block">Logged in as</span>
                <span className="text-accent-500 font-bold">{user.name}</span>
            </div>
        )}
      </div>
      
      {loading ? (
        <p className="text-gray-400 animate-pulse">Loading courses...</p>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 bg-dark-800 rounded-xl border border-gray-700">
          <p className="text-gray-400">No approved courses available yet.</p>
          <p className="text-sm text-gray-600 mt-2">Instructors are currently uploading content for approval.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.map(course => {
             const status = getButtonState(course); // Pass full course object now

             return (
                <div key={course._id} className="bg-dark-800 rounded-xl border border-gray-700 overflow-hidden hover:border-accent-500 transition shadow-lg flex flex-col">
                    <div className="h-32 bg-gradient-to-r from-indigo-900 to-purple-900 flex items-center justify-center relative">
                        <span className="text-4xl">🎓</span>
                        {/* Show OWNED badge if owned OR completed */}
                        {(status === 'owned' || status === 'course_completed') && <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">OWNED</div>}
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-2">{course.title}</h3>
                        <p className="text-sm text-accent-500 mb-4">By {course.instructorId?.name || 'Instructor'}</p>
                        <p className="text-gray-400 text-sm mb-6 flex-1 line-clamp-3">{course.description}</p>
                        
                        <div className="flex justify-between items-center mt-auto border-t border-gray-700 pt-4">
                            <span className="text-2xl font-bold text-white">৳{course.price}</span>
                            
                            {status === 'buy' || status === 'declined' ? (
                                <button 
                                    onClick={() => initiateBuy(course._id, course.price)} 
                                    className={`text-white px-4 py-2 rounded font-bold transition ${status === 'declined' ? 'bg-red-600 hover:bg-red-500' : 'bg-accent-500 hover:bg-indigo-600'}`}
                                >
                                    {status === 'declined' ? 'Retry' : 'Buy Course'}
                                </button>
                            ) : status === 'pending' ? (
                                <button disabled className="bg-yellow-600 text-white px-4 py-2 rounded font-bold cursor-not-allowed opacity-80 text-sm">
                                    Pending Confirmation
                                </button>
                            ) : status === 'course_completed' ? (
                                // --- COMPLETED BUTTON ---
                                <button 
                                    onClick={() => handleStartLearning(course._id)}
                                    className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded font-bold shadow-glow"
                                >
                                    Completed
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handleStartLearning(course._id)}
                                    className="bg-green-600 hover:bg-green-500 transition text-white px-4 py-2 rounded font-bold shadow-glow"
                                >
                                    Start Learning
                                </button>
                            )}
                        </div>
                    </div>
                </div>
             );
          })}
        </div>
      )}

      {/* --- PAYMENT MODAL --- */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-dark-800 p-8 rounded-xl border border-gray-700 shadow-2xl w-full max-w-md transform transition-all scale-100">
                <h3 className="text-xl font-bold text-white mb-2">💸 Confirm Payment</h3>
                <p className="text-gray-400 text-sm mb-6">
                    Enter your Secret PIN to confirm payment of <b className="text-green-400">৳{selectedCourse?.price}</b>.
                </p>
                
                <form onSubmit={confirmPurchase}>
                    <input 
                        type="password" 
                        placeholder="Enter Secret PIN" 
                        className="input-field mb-6 text-center text-lg tracking-widest"
                        autoFocus
                        value={pinInput}
                        onChange={e => setPinInput(e.target.value)}
                    />
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setShowPayModal(false)} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold">Cancel</button>
                        <button type="submit" className="flex-1 py-3 bg-accent-500 hover:bg-indigo-600 text-white rounded-lg font-bold shadow-lg">Pay Now</button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default LearnerCourses;