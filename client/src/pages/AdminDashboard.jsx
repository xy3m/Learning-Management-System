import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Wallet, Users, CheckCircle, Activity, 
  Trash2, Plus, Lock, X, Play, Music, FileText, 
  AlertTriangle 
} from 'lucide-react';

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

const TabButton = ({ active, onClick, label, icon: Icon }) => (
  <button 
    onClick={onClick} 
    className={`
      relative flex items-center gap-3 px-8 py-4 rounded-xl transition-all duration-300 font-bold text-base z-10
      ${active ? 'text-[#D1F2EB]' : 'text-[#D1F2EB]/70 hover:text-[#D1F2EB] hover:bg-white/5'}
    `}
  >
    {active && (
      <motion.div 
        layoutId="activeTab"
        className="absolute inset-0 bg-[#0B6E4F]/20 border border-[#50C878]/30 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.3)]"
      />
    )}
    <Icon size={20} className={active ? "text-[#50C878]" : ""} />
    <span className="relative z-10">{label}</span>
  </button>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('transactions'); 
  
  // Data States
  const [balance, setBalance] = useState(0);
  const [instData, setInstData] = useState({ name: '', email: '', password: '' });
  const [instructorsList, setInstructorsList] = useState([]);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Sidebar States
  const [viewingClass, setViewingClass] = useState(null); 
  const [viewingCourseTitle, setViewingCourseTitle] = useState(''); 

  // Security Modal States
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const [approvingCourseId, setApprovingCourseId] = useState(null);

  const user = JSON.parse(sessionStorage.getItem('user'));

  useEffect(() => {
    fetchBalance(); 
    if (activeTab === 'instructors') fetchInstructors();
    if (activeTab === 'approvals') fetchPendingCourses();
    if (activeTab === 'transactions') fetchTransactions();
  }, [activeTab]);

  const fetchBalance = async () => {
    if(!user) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/bank/balance/${user.id}`);
      setBalance(res.data.balance);
    } catch (err) { setBalance(0); }
  };

  const fetchInstructors = async () => {
    try {
        const res = await axios.get('http://localhost:5000/api/admin/instructors');
        setInstructorsList(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchPendingCourses = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/pending-courses');
      setPendingCourses(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchTransactions = async () => {
    try {
        const res = await axios.get('http://localhost:5000/api/admin/transactions');
        setTransactions(res.data);
    } catch (err) { console.error(err); }
  };

  const initiateApproval = (courseId) => {
      setApprovingCourseId(courseId);
      setSecretInput('');
      setShowSecretModal(true);
  };

  const confirmApproval = async (e) => {
    e.preventDefault();
    if (!secretInput) return alert("Please enter the PIN.");

    try {
      await axios.put(`http://localhost:5000/api/admin/approve/${approvingCourseId}`, {
          adminSecret: secretInput
      });
      
      alert("✅ Verified! Content Approved & ৳1000 Sent.");
      setShowSecretModal(false); 
      fetchPendingCourses(); 
      fetchBalance(); 
    } catch (err) { 
      alert("❌ Approval Failed: " + (err.response?.data?.message || err.message)); 
    }
  };

  const handleDeclineContent = async (courseId) => {
    if(!window.confirm("Are you sure you want to DECLINE this course?")) return;
    try {
      await axios.put(`http://localhost:5000/api/admin/decline/${courseId}`);
      alert("Course Declined.");
      fetchPendingCourses(); 
    } catch (err) { alert("Decline failed."); }
  };

  const handleTxAction = async (id, action) => {
    try {
        const res = await axios.post('http://localhost:5000/api/admin/transaction-action', { transactionId: id, action });
        alert(res.data.message);
        fetchTransactions();
        fetchBalance(); 
    } catch(err) { alert("Action failed"); }
  };

  const handleClearHistory = async () => {
      if(!window.confirm("Clear all Completed and Declined transactions from your view?")) return;
      try {
          await axios.delete('http://localhost:5000/api/admin/clear-history');
          fetchTransactions(); 
          alert("Admin History Cleared!");
      } catch (err) { alert("Failed to clear history"); }
  };

  const handleDeleteInstructor = async (id) => {
      if(!window.confirm("WARNING: This will delete the instructor and ALL their courses. Continue?")) return;
      try {
          await axios.delete(`http://localhost:5000/api/admin/instructor/${id}`);
          alert("Instructor deleted.");
          fetchInstructors();
      } catch (err) { alert("Delete failed"); }
  };

  const handleCreateInstructor = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/create-instructor', instData);
      alert("Instructor Created Successfully!");
      setInstData({ name: '', email: '', password: '' });
      fetchInstructors(); 
    } catch (err) { alert("Failed to create instructor."); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 pb-20 pt-28 overflow-x-hidden">
      
      {/* --- DASHBOARD HEADER --- */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="bg-black/60 backdrop-blur-md border border-[#50C878]/30 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
          
          <div className="flex items-center gap-4">
             <div className="p-3 bg-[#50C878]/10 rounded-xl border border-[#50C878]/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
               <Shield className="text-[#50C878]" size={32} />
             </div>
             <div>
               <h1 className="text-3xl font-bold text-[#D1F2EB] tracking-tight">Admin<span className="text-[#50C878]">Panel</span></h1>
               <p className="text-sm text-[#D1F2EB]/70 font-mono uppercase tracking-wider">System Command v2.4</p>
             </div>
          </div>

          <div className="flex items-center gap-6">
             {/* Balance Card */}
             <div className="flex items-center gap-4 px-6 py-3 rounded-xl bg-black/40 border border-yellow-500/30/50 shadow-inner">
                <div className="p-2 rounded-full bg-green-500/10 text-green-400">
                   <Wallet size={24} />
                </div>
                <div>
                  <p className="text-xs text-[#D1F2EB]/70 uppercase tracking-widest font-bold">Treasury Balance</p>
                  <p className="text-2xl font-mono font-bold text-[#D1F2EB]">৳{balance.toLocaleString()}</p>
                </div>
             </div>
             {/* Logout Button Removed Here */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        
        {/* --- TABS --- */}
        <div className="flex justify-center mb-10">
          <div className="bg-black/50 p-2 rounded-2xl border border-[#50C878]/20 flex flex-wrap gap-2 justify-center shadow-lg">
            <TabButton 
              active={activeTab === 'instructors'} 
              onClick={() => setActiveTab('instructors')} 
              label="Personnel" 
              icon={Users} 
            />
            <TabButton 
              active={activeTab === 'approvals'} 
              onClick={() => setActiveTab('approvals')} 
              label="Approvals" 
              icon={CheckCircle} 
            />
             <TabButton 
              active={activeTab === 'transactions'} 
              onClick={() => setActiveTab('transactions')} 
              label="Ledger" 
              icon={Activity} 
            />
          </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <AnimatePresence mode="wait">
            
          {/* TAB 1: INSTRUCTOR MANAGEMENT */}
          {activeTab === 'instructors' && (
            <motion.div 
              key="instructors"
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-[#D1F2EB]">Active Personnel</h2>
                    <span className="text-sm font-bold bg-[#50C878]/20 text-[#D1F2EB] px-3 py-1 rounded-full">{instructorsList.length} Registered</span>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                    {instructorsList.length === 0 ? <p className="text-yellow-400 text-lg text-center py-10">No instructors found.</p> : 
                      instructorsList.map(inst => (
                        <GlassCard key={inst._id} className="group hover:border-[#50C878]/30 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-full bg-[#50C878]/10 text-[#50C878]">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-[#D1F2EB]">{inst.name}</h3>
                                        <p className="text-sm text-[#D1F2EB]/70 font-mono">{inst.email}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteInstructor(inst._id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-[#D1F2EB] transition">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                            
                            <div className="border-t border-[#50C878]/20 pt-4">
                                <p className="text-xs text-yellow-400 uppercase font-bold mb-3">Deployed Courses</p>
                                <div className="flex flex-wrap gap-2">
                                    {inst.courses.length === 0 && <span className="text-sm text-yellow-200 italic">Idle (No active courses)</span>}
                                    {inst.courses.map(c => (
                                        <span key={c._id} className={`text-xs font-bold px-3 py-1.5 rounded border ${c.status === 'approved' ? 'border-green-500/20 text-green-400 bg-green-500/5' : 'border-yellow-500/20 text-yellow-400 bg-yellow-500/5'}`}>
                                            {c.title}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </GlassCard>
                      ))
                    }
                </div>
              </div>

              {/* Create Form - CUSTOMIZED LOOK */}
              <div className="lg:col-span-1">
                 <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="sticky top-32 p-8 rounded-3xl bg-[#0b0e14] border border-[#50C878]/30 shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)] relative overflow-hidden"
                 >
                    {/* Ambient Glows for the "Ugly" Fix */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#0B6E4F]/30 rounded-full blur-[60px]" />
                    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#0B6E4F]/30 rounded-full blur-[60px]" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <Plus className="text-[#50C878]" size={24} />
                            <h2 className="font-bold uppercase text-lg text-indigo-100 tracking-wider">Recruit Instructor</h2>
                        </div>
                        
                        <form onSubmit={handleCreateInstructor} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-yellow-400 uppercase ml-1 tracking-wider">Full Name</label>
                                <input 
                                    className="w-full bg-white/5 border border-[#50C878]/30 text-[#D1F2EB] rounded-xl px-4 py-3 focus:outline-none focus:border-[#50C878] focus:bg-white/10 transition-all placeholder:text-yellow-100/40" 
                                    placeholder="John Doe" 
                                    value={instData.name} 
                                    onChange={e => setInstData({...instData, name: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-yellow-400 uppercase ml-1 tracking-wider">Email Address</label>
                                <input 
                                    className="w-full bg-white/5 border border-[#50C878]/30 text-[#D1F2EB] rounded-xl px-4 py-3 focus:outline-none focus:border-[#50C878] focus:bg-white/10 transition-all placeholder:text-yellow-100/40" 
                                    placeholder="admin@lms.sim" 
                                    value={instData.email} 
                                    onChange={e => setInstData({...instData, email: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-yellow-400 uppercase ml-1 tracking-wider">Assign Password</label>
                                <input 
                                    className="w-full bg-white/5 border border-[#50C878]/30 text-[#D1F2EB] rounded-xl px-4 py-3 focus:outline-none focus:border-[#50C878] focus:bg-white/10 transition-all placeholder:text-yellow-100/40" 
                                    type="password" 
                                    placeholder="••••••••" 
                                    value={instData.password} 
                                    onChange={e => setInstData({...instData, password: e.target.value})} 
                                    required 
                                />
                            </div>
                            
                            <button className="w-full py-4 mt-4 bg-gradient-to-r from-[#0B6E4F] to-[#0B6E4F] hover:from-[#50C878] hover:to-[#0B6E4F] text-[#D1F2EB] font-bold text-base rounded-xl shadow-lg shadow-[#50C878]/30 transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                                Initialize Account
                            </button>
                        </form>
                    </div>
                 </motion.div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: COURSE APPROVALS */}
          {activeTab === 'approvals' && (
             <motion.div 
               key="approvals"
               initial={{ opacity: 0, x: -20 }} 
               animate={{ opacity: 1, x: 0 }} 
               exit={{ opacity: 0, x: 20 }}
               className="max-w-5xl mx-auto"
             >
                {pendingCourses.length === 0 ? (
                    <div className="text-center py-24 bg-[#013220]/30 rounded-3xl border border-[#50C878]/20">
                        <CheckCircle size={64} className="mx-auto text-gray-700 mb-6" />
                        <p className="text-xl text-yellow-400 font-bold">System Clean. No pending approvals.</p>
                    </div>
                ) : (
                    pendingCourses.map(course => (
                        <GlassCard key={course._id} className="mb-8 hover:shadow-2xl hover:shadow-[#0B6E4F]/10 transition-shadow">
                            <div className="flex flex-col md:flex-row justify-between md:items-start gap-6">
                                <div>
                                    <div className="flex items-center gap-4 mb-3">
                                        <h3 className="text-3xl font-bold text-[#D1F2EB]">{course.title}</h3>
                                        <span className="px-3 py-1 rounded-md text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 uppercase tracking-wide">Pending Review</span>
                                    </div>
                                    <div className="space-y-2 text-base text-[#D1F2EB]/70">
                                        <p>Instructor: <span className="text-[#D1F2EB] font-bold">{course.instructorId?.name}</span></p>
                                        <p>Price: <span className="text-green-400 font-mono font-bold text-lg">৳{course.price}</span></p>
                                        <p>Content: <span className="text-[#D1F2EB]">{course.classes.length} Classes</span></p>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button onClick={() => handleDeclineContent(course._id)} className="px-6 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition text-sm font-bold">
                                        Decline
                                    </button>
                                    <button onClick={() => initiateApproval(course._id)} className="px-6 py-3 rounded-xl bg-green-600 text-[#D1F2EB] hover:bg-green-500 shadow-lg shadow-green-500/20 transition text-sm font-bold flex items-center justify-center gap-2">
                                        <CheckCircle size={18} />
                                        Approve & Pay
                                    </button>
                                </div>
                            </div>

                            <div className="mt-8 border-t border-[#50C878]/20 pt-6">
                                <p className="text-sm text-yellow-400 uppercase font-bold tracking-widest mb-4">Curriculum Audit</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {course.classes.map((cls, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => { setViewingClass({ ...cls, _idx: idx }); setViewingCourseTitle(course.title); }} 
                                            className="group cursor-pointer flex justify-between items-center p-4 rounded-xl bg-black/20 border border-[#50C878]/20 hover:bg-[#50C878]/10 hover:border-[#50C878]/30 transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#0B6E4F] text-yellow-400 text-sm font-bold font-mono group-hover:bg-[#50C878] group-hover:text-[#D1F2EB] transition-colors">
                                                    {idx+1}
                                                </div>
                                                <span className="text-base font-medium text-[#D1F2EB]/90 group-hover:text-[#D1F2EB] transition-colors">
                                                    Class Module
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {cls.video && <Play size={16} className="text-green-500" />}
                                                <span className="text-xs font-bold text-[#50C878] opacity-0 group-hover:opacity-100 transition-opacity uppercase">Preview</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </GlassCard>
                    ))
                )}
             </motion.div>
          )}

          {/* TAB 3: TRANSACTIONS */}
          {activeTab === 'transactions' && (
            <motion.div 
               key="transactions"
               initial={{ opacity: 0, x: -20 }} 
               animate={{ opacity: 1, x: 0 }} 
               exit={{ opacity: 0, x: 20 }}
               className="max-w-6xl mx-auto"
            >
               <GlassCard className="min-h-[600px]">
                  <div className="flex justify-between items-center mb-10">
                     <h2 className="text-3xl font-bold text-[#D1F2EB] flex items-center gap-3">
                         <Activity size={28} className="text-[#50C878]" />
                         Global Ledger
                     </h2>
                     {transactions.length > 0 && (
                         <button onClick={handleClearHistory} className="text-sm font-bold text-red-400 hover:text-[#D1F2EB] border border-red-500/30 px-4 py-2 rounded-lg hover:bg-red-500 transition">
                             Purge History
                         </button>
                     )}
                  </div>

                  {transactions.length === 0 ? <p className="text-yellow-400 text-xl text-center mt-32">No transaction records found.</p> : (
                      <div className="space-y-3">
                          {/* Header Row */}
                          <div className="grid grid-cols-12 text-xs font-bold text-yellow-400 uppercase tracking-widest px-6 pb-4 border-b border-[#50C878]/20">
                              <div className="col-span-5">Details</div>
                              <div className="col-span-3">Status</div>
                              <div className="col-span-2 text-right">Amount</div>
                              <div className="col-span-2 text-right">Action</div>
                          </div>
                          
                          {/* Data Rows */}
                          {transactions.map(tx => (
                              <div key={tx._id} className="grid grid-cols-12 items-center p-6 rounded-xl bg-black/20 hover:bg-white/5 transition-colors">
                                  <div className="col-span-5">
                                      <p className="text-base font-bold text-[#D1F2EB] truncate pr-4">{tx.courseId?.title || "Unknown Course"}</p>
                                      <div className="flex items-center gap-2 mt-2">
                                          <span className="text-xs text-yellow-400 uppercase font-bold">Learner:</span>
                                          <span className="text-xs font-bold text-[#D1F2EB] bg-[#50C878]/10 px-2 py-0.5 rounded">{tx.learnerId?.name}</span>
                                      </div>
                                      <p className="text-xs text-yellow-200 mt-1">{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}</p>
                                  </div>
                                  <div className="col-span-3">
                                      <span className={`text-xs px-3 py-1.5 rounded-full uppercase font-bold tracking-wide ${
                                           tx.status === 'completed' ? 'text-green-400 bg-green-500/10 border border-green-500/20' :
                                           tx.status.includes('pending') ? 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20' : 
                                           tx.status.includes('declined') ? 'text-red-400 bg-red-500/10 border border-red-500/20' : 'text-[#D1F2EB]/70 bg-gray-500/10'
                                      }`}>
                                          {tx.status.replace('_', ' ')}
                                      </span>
                                  </div>
                                  <div className="col-span-2 text-right">
                                      <p className="font-mono font-bold text-lg text-[#D1F2EB]">৳{tx.amount}</p>
                                  </div>
                                  <div className="col-span-2 text-right">
                                       {tx.status === 'pending_admin' ? (
                                           <div className="flex justify-end gap-2">
                                               <button onClick={() => handleTxAction(tx._id, 'approve')} className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500 hover:text-[#D1F2EB] transition"><CheckCircle size={18}/></button>
                                               <button onClick={() => handleTxAction(tx._id, 'decline')} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-[#D1F2EB] transition"><X size={18}/></button>
                                           </div>
                                       ) : (
                                          <span className="text-gray-700 text-2xl font-thin block mr-4">-</span>
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

      {/* --- CONTENT PREVIEW DRAWER (SLIDE-OVER) --- */}
      <AnimatePresence>
        {viewingClass && (
           <>
             {/* Backdrop */}
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setViewingClass(null)}
               className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
             />
             {/* Drawer */}
             <motion.div 
               initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
               transition={{ type: "spring", stiffness: 300, damping: 30 }}
               className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-[#0b0f19] border-l border-[#50C878]/30 shadow-2xl z-50 flex flex-col"
             >
                <div className="p-8 border-b border-[#50C878]/20 flex justify-between items-center bg-black/50">
                    <div>
                        <h2 className="text-2xl font-bold text-[#D1F2EB]">Content Audit</h2>
                        <p className="text-sm font-medium text-[#50C878] truncate max-w-[300px] mt-1">{viewingCourseTitle}</p>
                    </div>
                    <button onClick={() => setViewingClass(null)} className="p-2 hover:bg-white/10 rounded-full transition"><X size={24} className="text-[#D1F2EB]/70"/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Video */}
                    <div className="bg-black/40 rounded-2xl p-6 border border-[#50C878]/20">
                        <div className="flex items-center gap-2 mb-4 text-sm font-bold text-yellow-400 uppercase tracking-wider">
                            <Play size={16} className="text-[#50C878]" /> Video Material
                        </div>
                        {viewingClass.video ? (
                            <video src={viewingClass.video} controls className="w-full rounded-xl shadow-lg border border-[#50C878]/20" />
                        ) : (
                            <div className="h-40 flex items-center justify-center bg-[#0B6E4F]/50 rounded-xl text-sm font-medium text-yellow-400 border border-dashed border-yellow-500/30">No Video Uploaded</div>
                        )}
                    </div>

                    {/* Audio */}
                    <div className="bg-black/40 rounded-2xl p-6 border border-[#50C878]/20">
                         <div className="flex items-center gap-2 mb-4 text-sm font-bold text-yellow-400 uppercase tracking-wider">
                            <Music size={16} className="text-[#0B6E4F]" /> Audio Material
                        </div>
                        {viewingClass.audio ? (
                            <audio src={viewingClass.audio} controls className="w-full h-10" />
                        ) : (
                            <p className="text-sm text-yellow-200 italic">No audio content available.</p>
                        )}
                    </div>

                    {/* Text */}
                    <div className="bg-black/40 rounded-2xl p-6 border border-[#50C878]/20">
                        <div className="flex items-center gap-2 mb-4 text-sm font-bold text-yellow-400 uppercase tracking-wider">
                            <FileText size={16} className="text-blue-500" /> Text Content
                        </div>
                        <p className="text-base text-[#D1F2EB]/90 leading-relaxed whitespace-pre-wrap">{viewingClass.text || "No text content provided."}</p>
                    </div>

                    {/* MCQs */}
                    <div>
                         <div className="flex items-center gap-2 mb-4 text-sm font-bold text-yellow-400 uppercase tracking-wider">
                            <AlertTriangle size={16} className="text-orange-500" /> Assessment Data
                        </div>
                        <div className="space-y-4">
                            {viewingClass.mcq.length === 0 ? <p className="text-sm text-yellow-200 italic">No questions configured.</p> : 
                             viewingClass.mcq.map((q, i) => (
                                <div key={i} className="p-4 bg-[#0B6E4F]/50 rounded-xl border border-[#50C878]/20">
                                    <p className="text-sm font-bold text-[#D1F2EB] mb-3"><span className="text-yellow-400 mr-2">Q{i+1}</span>{q.question}</p>
                                    <div className="space-y-2 pl-3 border-l-2 border-yellow-500/30">
                                        {q.options.map((opt, oid) => (
                                            <p key={oid} className={`text-sm ${opt === q.answer ? "text-green-400 font-bold" : "text-yellow-400"}`}>
                                                {opt === q.answer ? "✓ " : "• "} {opt}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
             </motion.div>
           </>
        )}
      </AnimatePresence>

      {/* --- SECURITY CHECK MODAL --- */}
      <AnimatePresence>
        {showSecretModal && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#013220]/80 backdrop-blur-md"
                onClick={() => setShowSecretModal(false)}
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-lg bg-[#0f1218] border border-red-500/30 rounded-3xl p-10 shadow-[0_0_60px_rgba(220,38,38,0.25)]"
              >
                  <div className="flex justify-center mb-8">
                      <div className="p-6 bg-red-500/10 rounded-full border border-red-500/20 text-red-500 animate-pulse">
                          <Lock size={40} />
                      </div>
                  </div>
                  
                  <h3 className="text-3xl font-bold text-center text-[#D1F2EB] mb-3">Authorization Required</h3>
                  <p className="text-center text-[#D1F2EB]/70 text-base mb-10 leading-relaxed">
                      Initiating secure transfer of <span className="text-[#D1F2EB] font-bold">৳1000</span>. <br/>Enter protocol secret to confirm action.
                  </p>

                  <form onSubmit={confirmApproval}>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        className="w-full bg-black/50 border border-yellow-500/30 text-center text-3xl tracking-[0.5em] text-[#D1F2EB] rounded-2xl py-5 mb-8 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all placeholder:tracking-normal placeholder:text-base placeholder:text-yellow-100/40" 
                        autoFocus 
                        value={secretInput} 
                        onChange={e => setSecretInput(e.target.value)} 
                      />
                      <div className="flex gap-4">
                          <button type="button" onClick={() => setShowSecretModal(false)} className="flex-1 py-4 rounded-xl border border-yellow-500/30 text-[#D1F2EB]/70 hover:text-[#D1F2EB] hover:border-gray-500 transition font-bold text-base">Cancel</button>
                          <button type="submit" className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-[#D1F2EB] rounded-xl font-bold text-base shadow-lg shadow-red-600/20 transition">Confirm Transfer</button>
                      </div>
                  </form>
              </motion.div>
           </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminDashboard;