import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ContentEditor from '../components/ContentEditor';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, BookOpen, Plus, Edit3, Trash2, 
  Clock, CheckCircle, TrendingUp,
  LayoutDashboard, History, Lock 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- STYLED COMPONENTS ---

const GlassCard = ({ children, className = "" }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`
      relative overflow-hidden
      bg-gray-900/40 backdrop-blur-xl 
      border border-white/5 shadow-xl
      rounded-2xl p-8 
      ${className}
    `}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
    {children}
  </motion.div>
);

const TabButton = ({ active, onClick, label, icon: Icon }) => (
  <button 
    onClick={onClick} 
    className={`
      relative flex items-center gap-3 px-8 py-4 rounded-xl transition-all duration-300 font-bold text-base z-10
      ${active ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}
    `}
  >
    {active && (
      <motion.div 
        layoutId="activeTab"
        className="absolute inset-0 bg-indigo-600/20 border border-indigo-500/30 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.3)]"
      />
    )}
    <Icon size={20} className={active ? "text-indigo-400" : ""} />
    <span className="relative z-10">{label}</span>
  </button>
);

const InstructorDashboard = () => {
  const navigate = useNavigate();
  
  // --- USER STATE ---
  const [user, setUser] = useState(JSON.parse(sessionStorage.getItem('user')));
  
  // --- DASHBOARD STATES ---
  const [balance, setBalance] = useState(0);
  const [courses, setCourses] = useState([]);
  const [transactions, setTransactions] = useState([]); 
  const [activeTab, setActiveTab] = useState('courses'); 
  const [step, setStep] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [courseData, setCourseData] = useState({ title: '', description: '', price: '', numClasses: '', classes: [] });

  // --- BANK SETUP STATE ---
  const [bankData, setBankData] = useState({ accountNumber: '', secret: '' });

  useEffect(() => {
    if (!user || user.role !== 'instructor') {
      navigate('/login'); 
      return;
    }
    
    // Only fetch dashboard data if Bank is set up
    if (user.bankAccountId) {
        fetchBalance();
        fetchCourses();
    }
  }, [user]); 

  const fetchBalance = async () => {
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

  const fetchHistory = async () => {
    try {
        const res = await axios.get(`http://localhost:5000/api/instructor/my-history/${user.id}`);
        setTransactions(res.data);
    } catch (err) { console.error(err); }
  };

  const handleBankSetup = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("Linking payout account...");
    try {
      const res = await axios.post('http://localhost:5000/api/bank/setup', {
        userId: user.id,
        accountNumber: bankData.accountNumber,
        secret: bankData.secret
      });
      
      const updatedUser = { ...user, bankAccountId: res.data._id };
      sessionStorage.setItem('user', JSON.stringify(updatedUser)); 
      setUser(updatedUser); 
      
      toast.success("Bank Setup Complete! Ready for payouts.", { id: loadingToast });

    } catch (err) {
      toast.error("Setup Failed: " + (err.response?.data?.message || err.message), { id: loadingToast });
    }
  };

  // --- EXISTING HANDLERS ---
  const handleTxAction = async (id, action) => {
    const loadingToast = toast.loading("Processing transaction...");
    try {
        const res = await axios.post('http://localhost:5000/api/instructor/transaction-action', { transactionId: id, action });
        toast.success(res.data.message, { id: loadingToast });
        fetchHistory(); 
        fetchBalance(); 
    } catch(err) { toast.error("Action Failed", { id: loadingToast }); }
  };

  const handleClearHistory = async () => {
      if(!window.confirm("Clear all Completed and Declined transactions?")) return;
      try {
          await axios.delete(`http://localhost:5000/api/instructor/clear-history/${user.id}`);
          fetchHistory(); 
          toast.success("History Cleared!");
      } catch (err) { toast.error("Failed to clear history"); }
  };

  const handleDelete = async (courseId) => {
    if(!window.confirm("Are you sure you want to delete this course?")) return;
    try {
        await axios.delete(`http://localhost:5000/api/instructor/delete/${courseId}`);
        toast.success("Course Deleted");
        fetchCourses();
    } catch (err) { toast.error(err.response?.data?.message || "Delete failed"); }
  };

  const handleEdit = (course) => {
    setCourseData({ title: course.title, description: course.description, price: course.price, numClasses: course.classes.length, classes: course.classes });
    setEditingCourseId(course._id);
    setIsEditing(true);
    setStep(2);
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    if (!courseData.title || !courseData.price || !courseData.numClasses || !courseData.description) {
        toast.error("Please fill in all fields before proceeding.");
        return;
    }
    setCourseData(prev => {
        const currentClasses = prev.classes || [];
        let newClasses = [...currentClasses];
        const targetNum = parseInt(prev.numClasses);
        if (targetNum > currentClasses.length) {
            const extraNeeded = targetNum - currentClasses.length;
            const extraClasses = Array.from({ length: extraNeeded }, () => ({ video: '', audio: '', text: '', mcq: [] }));
            newClasses = [...newClasses, ...extraClasses];
        } else if (targetNum < currentClasses.length) {
            newClasses = newClasses.slice(0, targetNum);
        }
        return { ...prev, classes: newClasses };
    });
    setStep(2); 
  };

  const handleFinalSubmit = async () => {
      const loadingToast = toast.loading("Submitting course content...");
      try {
        if (isEditing && editingCourseId) {
            await axios.put(`http://localhost:5000/api/instructor/update/${editingCourseId}`, { 
                ...courseData, 
                instructorId: user.id 
            });
            toast.success("Course Updated! Sent for Admin Approval.", { id: loadingToast });
        } else {
            await axios.post('http://localhost:5000/api/instructor/upload', { 
                ...courseData, 
                instructorId: user.id 
            });
            toast.success("Course Submitted! Pending Admin Approval.", { id: loadingToast });
        }
        setStep(1); 
        setIsEditing(false); 
        setEditingCourseId(null);
        setCourseData({ title: '', description: '', price: '', numClasses: '', classes: [] });
        fetchCourses();
      } catch (err) { toast.error("Submission Failed: " + (err.response?.data?.message || err.message), { id: loadingToast }); }
  };

  const cancelEdit = () => { setStep(1); setIsEditing(false); setEditingCourseId(null); setCourseData({ title: '', description: '', price: '', numClasses: '', classes: [] }); };

  // --- RENDER: 1. BANK SETUP (If missing) ---
  if (user && !user.bankAccountId) {
    return (
      <div className="absolute inset-0 w-full h-full bg-[#030712] flex items-center justify-center p-6 overflow-hidden z-50">
        <Toaster position="top-center" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        
        <GlassCard className="max-w-lg w-full relative z-10 border-indigo-500/20 shadow-[0_0_50px_-12px_rgba(99,102,241,0.2)]">
          <div className="text-center mb-8">
             <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
                <Wallet className="text-indigo-400" size={40} />
             </div>
             <h2 className="text-3xl font-bold text-white mb-3">Setup Payout Account</h2>
             <p className="text-gray-400 text-base">Link a bank account to receive your <span className="text-white font-bold">60% revenue share</span>.</p>
          </div>
          
          <form onSubmit={handleBankSetup} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 uppercase ml-1">Account Number</label>
              <input 
                type="text" 
                placeholder="e.g. INST-888-999" 
                className="w-full bg-black/40 border border-gray-700 text-white rounded-xl py-4 px-5 text-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-600"
                onChange={e => setBankData({...bankData, accountNumber: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 uppercase ml-1">Create Secret PIN</label>
              <input 
                type="password" 
                placeholder="Secret PIN" 
                className="w-full bg-black/40 border border-gray-700 text-white rounded-xl py-4 px-5 text-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-600"
                onChange={e => setBankData({...bankData, secret: e.target.value})}
                required
              />
            </div>
            <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-indigo-500/20 transition-all mt-4"
            >
                Initialize Account
            </motion.button>
          </form>
        </GlassCard>
      </div>
    );
  }

  // --- RENDER: 2. MAIN DASHBOARD ---
  return (
    <div className="absolute inset-0 w-full min-h-screen bg-[#030712] text-gray-200 overflow-x-hidden overflow-y-auto">
      <div className="pt-28 pb-20 w-full"> {/* Padding for Fixed Navbar */}
      
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#1f2937', color: '#fff' }}}/>
      
      {/* --- DASHBOARD HEADER --- */}
      <div className="w-full px-8 mb-10">
        <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-8 flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
          
          <div className="flex items-center gap-6">
             <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
               <LayoutDashboard className="text-purple-400" size={40} />
             </div>
             <div>
               <h1 className="text-4xl font-bold text-white tracking-tight mb-1">Instructor<span className="text-purple-400">Studio</span></h1>
               <p className="text-base text-gray-400 font-mono uppercase tracking-wider">Content Command Center</p>
             </div>
          </div>

          <div className="flex items-center gap-8">
             {/* Balance Card */}
             <div className="flex items-center gap-6 px-8 py-4 rounded-2xl bg-black/40 border border-gray-700/50 shadow-inner">
                <div className="p-3 rounded-full bg-green-500/10 text-green-400">
                   <TrendingUp size={32} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 uppercase tracking-widest font-bold">Total Earnings</p>
                  <p className="text-3xl font-mono font-bold text-white">৳{balance.toLocaleString()}</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="w-full px-8">
        
        {/* --- TABS --- */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-900/50 p-2 rounded-2xl border border-white/5 flex flex-wrap gap-3 justify-center shadow-lg">
            <TabButton 
              active={activeTab === 'courses'} 
              onClick={() => setActiveTab('courses')} 
              label="Course Manager" 
              icon={BookOpen} 
            />
            <TabButton 
              active={activeTab === 'history'} 
              onClick={() => { setActiveTab('history'); fetchHistory(); }} 
              label="Transaction History" 
              icon={History} 
            />
          </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <AnimatePresence mode="wait">
            
          {/* TAB 1: COURSES */}
          {activeTab === 'courses' && (
            <motion.div 
              key="courses"
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 20 }}
            >
                {step === 1 && (
                    // WIDENED GRID: 50/50 split
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                        
                        {/* --- CREATE / EDIT FORM --- */}
                        <div className="h-fit sticky top-32">
                            <motion.div 
                                className="bg-[#0f1116] border border-gray-800 rounded-3xl p-10 shadow-2xl relative overflow-hidden"
                                whileHover={{ borderColor: "rgba(139, 92, 246, 0.3)" }}
                            >
                                {/* Ambient Glow */}
                                <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-[60px] pointer-events-none" />

                                {/* Form Header */}
                                <div className="flex items-center gap-4 mb-8 relative z-10">
                                    {isEditing ? <Edit3 className="text-purple-400" size={28} /> : <Plus className="text-purple-400" size={28} />}
                                    <h2 className="font-bold uppercase text-2xl text-purple-100 tracking-wider">
                                        {isEditing ? "Edit Course" : "Create New Course"}
                                    </h2>
                                </div>
                                
                                <form onSubmit={handleStep1Submit} className="space-y-7 relative z-10">
                                    <div>
                                        <label className="text-sm font-bold text-gray-500 uppercase ml-1 tracking-wider mb-2 block">Title</label>
                                        <input 
                                            className="w-full bg-[#27272a] border border-gray-700/50 text-white rounded-xl p-5 text-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-gray-500" 
                                            placeholder="e.g. Advanced Python" 
                                            value={courseData.title} 
                                            onChange={e => setCourseData({...courseData, title: e.target.value})} 
                                            required 
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-sm font-bold text-gray-500 uppercase ml-1 tracking-wider mb-2 block">Price (৳)</label>
                                            <input 
                                                className="w-full bg-[#27272a] border border-gray-700/50 text-white rounded-xl p-5 text-xl focus:outline-none focus:border-purple-500 transition-all" 
                                                type="number" 
                                                placeholder="5000" 
                                                value={courseData.price} 
                                                onChange={e => setCourseData({...courseData, price: e.target.value})} 
                                                required 
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-bold text-gray-500 uppercase ml-1 tracking-wider mb-2 block">Classes</label>
                                            <input 
                                                className="w-full bg-[#27272a] border border-gray-700/50 text-white rounded-xl p-5 text-xl focus:outline-none focus:border-purple-500 transition-all" 
                                                type="number" 
                                                placeholder="10" 
                                                min="1" 
                                                max="50" 
                                                value={courseData.numClasses} 
                                                onChange={e => setCourseData({...courseData, numClasses: e.target.value})} 
                                                required 
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-gray-500 uppercase ml-1 tracking-wider mb-2 block">Description</label>
                                        <textarea 
                                            className="w-full bg-[#27272a] border border-gray-700/50 text-white rounded-xl p-5 text-lg h-48 resize-none focus:outline-none focus:border-purple-500 transition-all placeholder:text-gray-500" 
                                            placeholder="What will students learn?" 
                                            value={courseData.description} 
                                            onChange={e => setCourseData({...courseData, description: e.target.value})} 
                                            required 
                                        />
                                    </div>
                                    
                                    <div className="flex gap-4 pt-4">
                                        <button className="flex-1 py-5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xl rounded-xl shadow-lg shadow-purple-500/30 transition-all transform hover:-translate-y-1">
                                            Next: Add Content →
                                        </button>
                                        {isEditing && (
                                            <button type="button" onClick={cancelEdit} className="px-8 py-5 border border-gray-600 text-gray-400 hover:text-white rounded-xl transition-all font-bold text-lg">
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </motion.div>
                        </div>

                        {/* Course List - STACKED FULL WIDTH */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-6 mb-6">
                                <h2 className="text-4xl font-bold text-white">My Library</h2>
                                <span className="px-5 py-2 rounded-full bg-purple-500/20 text-purple-300 font-bold text-base border border-purple-500/30">
                                    {courses.length} Courses
                                </span>
                            </div>

                            {/* UPDATED: flex-col ensures cards stack vertically and take full width */}
                            <div className="flex flex-col gap-6">
                                {courses.map(c => (
                                    <GlassCard key={c._id} className="group hover:border-purple-500/30 transition-all w-full">
                                        <div className="flex flex-col h-full justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <h3 className="text-2xl font-bold text-white line-clamp-1" title={c.title}>{c.title}</h3>
                                                    {c.status === 'approved' 
                                                        ? <CheckCircle size={28} className="text-green-500 flex-shrink-0" />
                                                        : <Clock size={28} className="text-yellow-500 flex-shrink-0" />
                                                    }
                                                </div>
                                                <p className="text-base text-gray-400 line-clamp-2 mb-6 h-12 leading-relaxed">{c.description}</p>
                                                
                                                <div className="flex items-center gap-4 text-sm font-mono text-gray-500 mb-6">
                                                    <span className="bg-gray-800 px-4 py-2 rounded-lg">৳{c.price}</span>
                                                    <span className="bg-gray-800 px-4 py-2 rounded-lg">{c.classes.length} Modules</span>
                                                </div>
                                            </div>

                                            <div className="border-t border-white/5 pt-5 flex justify-between items-center">
                                                <span className={`text-sm uppercase font-bold tracking-wider px-3 py-1.5 rounded ${
                                                    c.status === 'approved' ? 'text-green-400 bg-green-900/20' : 'text-yellow-400 bg-yellow-900/20'
                                                }`}>
                                                    {c.status}
                                                </span>
                                                
                                                {c.status !== 'approved' ? (
                                                    <div className="flex gap-3">
                                                        <button onClick={() => handleEdit(c)} className="p-3 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition">
                                                            <Edit3 size={20} />
                                                        </button>
                                                        <button onClick={() => handleDelete(c._id)} className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition">
                                                            <Trash2 size={20} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-600 italic flex items-center gap-2 font-bold">
                                                        <Lock size={16} /> Locked
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </GlassCard>
                                ))}
                                {courses.length === 0 && (
                                    <div className="w-full py-20 text-center border-2 border-dashed border-gray-800 rounded-3xl bg-black/20">
                                        <p className="text-gray-500 text-xl">No courses uploaded yet.</p>
                                        <p className="text-gray-600 text-base mt-2">Use the form on the left to create your first course.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <ContentEditor 
                        courseData={courseData} 
                        setCourseData={setCourseData} 
                        onBack={cancelEdit} 
                        onFinalSubmit={handleFinalSubmit} 
                    />
                )}
            </motion.div>
          )}

          {/* TAB 2: TRANSACTION HISTORY */}
          {activeTab === 'history' && (
            <motion.div 
               key="history"
               initial={{ opacity: 0, x: -20 }} 
               animate={{ opacity: 1, x: 0 }} 
               exit={{ opacity: 0, x: 20 }}
               className="w-full"
            >
               <GlassCard className="min-h-[600px] p-10">
                  <div className="flex justify-between items-center mb-10">
                     <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                         <History size={32} className="text-purple-400" />
                         Recent Payouts
                     </h2>
                     {transactions.length > 0 && (
                         <button onClick={handleClearHistory} className="text-base font-bold text-red-400 hover:text-white border border-red-500/30 px-6 py-3 rounded-xl hover:bg-red-500 transition">
                             Purge History
                         </button>
                     )}
                  </div>

                  {transactions.length === 0 ? <p className="text-gray-600 text-xl text-center mt-32">No transaction records found.</p> : (
                      <div className="space-y-4">
                          {transactions.map(tx => (
                              <div key={tx._id} className="grid grid-cols-12 items-center p-6 rounded-2xl bg-black/20 hover:bg-white/5 transition-colors text-lg border border-white/5">
                                  <div className="col-span-5">
                                      <p className="font-bold text-white truncate text-xl">{tx.courseId?.title || "Unknown Course"}</p>
                                      <div className="flex items-center gap-3 mt-2">
                                          <span className="text-base text-gray-500 uppercase font-bold">Student:</span>
                                          <span className="text-base text-purple-300 font-medium px-2 py-0.5 bg-purple-500/10 rounded">{tx.learnerId?.name}</span>
                                      </div>
                                      <p className="text-sm text-gray-600 mt-1">{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}</p>
                                  </div>
                                  
                                  <div className="col-span-3">
                                      <span className={`text-sm px-4 py-2 rounded-full uppercase font-bold border tracking-wide ${
                                           tx.status === 'completed' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                                           tx.status === 'pending_instructor' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' : 
                                           tx.status.includes('declined') ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-gray-400 bg-gray-500/10 border-white/10'
                                      }`}>
                                          {tx.status === 'declined_instructor' ? 'REJECTED' : tx.status.replace('_', ' ')}
                                      </span>
                                  </div>
                                  
                                  <div className="col-span-4 text-right flex flex-col items-end gap-3">
                                       {tx.status === 'pending_instructor' ? (
                                           <div className="flex gap-3">
                                               <button onClick={() => handleTxAction(tx._id, 'approve')} className="px-5 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold transition shadow-lg shadow-green-500/20">Accept</button>
                                               <button onClick={() => handleTxAction(tx._id, 'decline')} className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold transition shadow-lg shadow-red-600/20">Reject</button>
                                           </div>
                                       ) : (
                                          <span className="text-gray-400 font-mono text-2xl font-bold">
                                              {tx.status === 'completed' ? '+' : ''}৳{Math.floor(tx.amount * 0.6)}
                                          </span>
                                       )}
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
               </GlassCard>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
      
      </div>
    </div>
  );
};

export default InstructorDashboard;