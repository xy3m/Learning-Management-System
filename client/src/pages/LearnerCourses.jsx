import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// FIX: Added 'AlertTriangle' to imports
import { 
  Search, BookOpen, Clock, CheckCircle, Lock, 
  CreditCard, Play, Award, Layers, Sparkles, AlertTriangle 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- STYLED COMPONENTS ---

const GlassCard = ({ children, className = "" }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5 }}
    transition={{ duration: 0.3 }}
    className={`
      relative overflow-hidden
      bg-gray-900/40 backdrop-blur-xl 
      border border-white/5 shadow-xl
      rounded-2xl flex flex-col
      ${className}
    `}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
    {children}
  </motion.div>
);

const LearnerCourses = () => {
  const [courses, setCourses] = useState([]);
  const [myTransactions, setMyTransactions] = useState([]); 
  const [myProgress, setMyProgress] = useState([]); 
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
        fetchMyProgress(); 
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

  const fetchMyProgress = async () => {
    try {
        const res = await axios.get(`http://localhost:5000/api/learner/my-progress/${user.id}`);
        setMyProgress(res.data);
    } catch (err) { console.error(err); }
  };

  const initiateBuy = (courseId, price) => {
      if(!user) return toast.error("Please login to purchase courses");
      setSelectedCourse({ id: courseId, price });
      setPinInput('');
      setShowPayModal(true);
  };

  const confirmPurchase = async (e) => {
      e.preventDefault();
      const loadingToast = toast.loading("Processing transaction...");
      
      if(!pinInput) {
          toast.error("Please enter your PIN", { id: loadingToast });
          return;
      }

      try {
          await axios.post('http://localhost:5000/api/learner/buy', {
              learnerId: user.id,
              courseId: selectedCourse.id,
              learnerSecret: pinInput 
          });
          
          toast.success("Order Placed! Waiting for Admin Approval.", { id: loadingToast });
          setShowPayModal(false);
          fetchMyStatus(); 
      } catch (err) {
          toast.error("Purchase Failed: " + (err.response?.data?.message || err.message), { id: loadingToast });
      }
  };

  const handleStartLearning = (courseId) => {
      navigate(`/learning/${courseId}`);
  };

  // --- BUTTON STATUS LOGIC ---
  const getButtonState = (course) => {
      const courseId = course._id;

      // 1. Check if Course is COMPLETED
      const progress = myProgress.find(p => p.courseId === courseId);
      if (progress) {
          const totalClasses = course.classes.length;
          const visitedCount = progress.completedClassIndices.length;
          const classesWithQuiz = course.classes.filter(c => c.mcq && c.mcq.length > 0).length;
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
    <div className="min-h-screen bg-[#030712] text-gray-200 pt-28 pb-20 px-6">
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#1f2937', color: '#fff' }}}/>

      <div className="max-w-7xl mx-auto">
          
          {/* HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
              <div>
                  <h1 className="text-4xl font-bold text-white mb-2">Explore Courses</h1>
                  <p className="text-gray-400">Master new skills with our premium content library.</p>
              </div>
              
              <div className="relative group w-full md:w-auto">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                  </div>
                  <input 
                      type="text" 
                      className="bg-gray-900/50 border border-gray-700 text-white text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-3 transition-all placeholder:text-gray-600" 
                      placeholder="Search for courses..." 
                  />
              </div>
          </div>

          {/* CONTENT GRID */}
          {loading ? (
            <div className="flex justify-center py-32">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"/>
                    <span className="text-gray-500 font-mono text-sm">LOADING ARCHIVES...</span>
                </div>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-32 bg-gray-900/30 rounded-3xl border border-white/5">
                <BookOpen size={64} className="mx-auto text-gray-700 mb-6" />
                <p className="text-xl text-gray-500 font-bold">No courses available yet.</p>
                <p className="text-sm text-gray-600 mt-2">Check back later for new content.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence>
                    {courses.map(course => {
                        const status = getButtonState(course);
                        
                        return (
                            <GlassCard key={course._id} className="group h-full">
                                {/* --- THUMBNAIL SECTION --- */}
                                <div className="h-56 relative overflow-hidden bg-gray-900 flex items-center justify-center">
                                    {/* Option 1: If there is a real image (future proofing) */}
                                    {course.thumbnail ? (
                                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                    ) : (
                                        // Option 2: Vibrant Fallback Gradient with Icon
                                        <>
                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-700 opacity-80" />
                                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay" />
                                            
                                            {/* Centered Icon */}
                                            <motion.div 
                                                whileHover={{ scale: 1.1, rotate: 5 }}
                                                className="relative z-10 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl"
                                            >
                                                <Sparkles className="text-white w-12 h-12" />
                                            </motion.div>
                                        </>
                                    )}

                                    {/* Badges */}
                                    <div className="absolute top-4 left-4 z-20 flex gap-2">
                                        <span className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-white/10">
                                            <Layers size={12} className="text-indigo-300"/> {course.classes.length} Modules
                                        </span>
                                    </div>

                                    {(status === 'owned' || status === 'course_completed') && (
                                        <div className="absolute top-4 right-4 z-20">
                                            <span className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg shadow-green-500/20 flex items-center gap-1.5">
                                                <CheckCircle size={12} /> OWNED
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Body */}
                                <div className="p-6 flex flex-col flex-1">
                                    <div className="mb-4">
                                        <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                                            {course.title}
                                        </h3>
                                        <p className="text-sm text-gray-400 line-clamp-2 min-h-[40px] leading-relaxed">
                                            {course.description}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white uppercase border border-white/10">
                                            {course.instructorId?.name?.charAt(0) || 'I'}
                                        </div>
                                        <div className="text-xs">
                                            <p className="text-gray-500 uppercase tracking-wider font-bold text-[10px]">Instructor</p>
                                            <p className="text-gray-300 font-medium">{course.instructorId?.name || 'Unknown'}</p>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Price</span>
                                            <span className="text-2xl font-mono font-bold text-white">৳{course.price}</span>
                                        </div>

                                        {/* Action Button Logic */}
                                        {status === 'buy' || status === 'declined' ? (
                                            <button 
                                                onClick={() => initiateBuy(course._id, course.price)}
                                                className={`
                                                    px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all transform hover:-translate-y-1 flex items-center gap-2
                                                    ${status === 'declined' 
                                                        ? 'bg-red-600 hover:bg-red-500 shadow-red-600/20' 
                                                        : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
                                                    }
                                                `}
                                            >
                                                {status === 'declined' ? <AlertTriangle size={16}/> : <CreditCard size={16}/>}
                                                {status === 'declined' ? 'Retry Payment' : 'Enroll Now'}
                                            </button>
                                        ) : status === 'pending' ? (
                                            <button disabled className="px-6 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm font-bold flex items-center gap-2 cursor-not-allowed">
                                                <Clock size={16} /> Pending
                                            </button>
                                        ) : status === 'course_completed' ? (
                                            <button 
                                                onClick={() => handleStartLearning(course._id)}
                                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:to-orange-400 text-white text-sm font-bold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
                                            >
                                                <Award size={16} /> Completed
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => handleStartLearning(course._id)}
                                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:to-emerald-500 text-white text-sm font-bold shadow-lg shadow-green-500/20 transition-all flex items-center gap-2"
                                            >
                                                <Play size={16} /> Start Learning
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </GlassCard>
                        );
                    })}
                </AnimatePresence>
            </div>
          )}
      </div>

      {/* --- PAYMENT MODAL --- */}
      <AnimatePresence>
        {showPayModal && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={() => setShowPayModal(false)}
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-md bg-[#0f1218] border border-indigo-500/30 rounded-3xl p-10 shadow-[0_0_60px_rgba(99,102,241,0.25)]"
              >
                  <div className="flex justify-center mb-8">
                      <div className="p-6 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-indigo-500 animate-pulse">
                          <CreditCard size={40} />
                      </div>
                  </div>
                  
                  <h3 className="text-3xl font-bold text-center text-white mb-3">Secure Checkout</h3>
                  <p className="text-center text-gray-400 text-sm mb-10 leading-relaxed">
                      Confirming purchase of <span className="text-white font-bold block mt-1 text-lg">৳{selectedCourse?.price}</span>
                  </p>

                  <form onSubmit={confirmPurchase}>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        className="w-full bg-black/50 border border-gray-700 text-center text-3xl tracking-[0.5em] text-white rounded-2xl py-5 mb-8 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:tracking-normal placeholder:text-base placeholder:text-gray-600" 
                        autoFocus 
                        value={pinInput} 
                        onChange={e => setPinInput(e.target.value)} 
                      />
                      <div className="flex gap-4">
                          <button type="button" onClick={() => setShowPayModal(false)} className="flex-1 py-4 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition font-bold text-base">Cancel</button>
                          <button type="submit" className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-base shadow-lg shadow-indigo-600/20 transition transform hover:-translate-y-1">Confirm Payment</button>
                      </div>
                  </form>
              </motion.div>
           </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default LearnerCourses;