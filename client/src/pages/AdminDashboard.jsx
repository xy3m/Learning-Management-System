import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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

  // Inside AdminDashboard.jsx

const handleApproveContent = async (courseId) => {
  try {
    await axios.put(`http://localhost:5000/api/admin/approve/${courseId}`);
    alert("Content Approved! $1000 Bonus sent to Instructor.");
    
    fetchPendingCourses(); // Refresh list
    fetchBalance();        // <--- ADD THIS LINE to update the $ number instantly
  } catch (err) { 
    alert(err.response?.data?.message || "Approval failed."); 
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

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 flex flex-col items-center pb-20 relative">
      
      {/* HEADER WITH BALANCE */}
      <div className="w-full bg-dark-800 p-8 rounded-xl shadow-glow mb-8 flex justify-between items-center border border-gray-700">
        <div>
          <h1 className="text-3xl font-bold text-white">LMS Admin Panel</h1>
          <p className="text-gray-400">System Management</p>
        </div>
        
        <div className="text-right">
          <p className="text-sm text-gray-400 uppercase tracking-widest">Bank Balance</p>
          <p className="text-4xl font-mono text-accent-500 font-bold mt-2">${balance}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 mb-8 border-b border-gray-700 pb-2 w-full justify-center">
        <button onClick={() => setActiveTab('instructors')} className={`pb-2 px-4 transition ${activeTab === 'instructors' ? 'text-accent-500 border-b-2 font-bold' : 'text-gray-400'}`}>Instructor Management</button>
        <button onClick={() => setActiveTab('approvals')} className={`pb-2 px-4 transition ${activeTab === 'approvals' ? 'text-accent-500 border-b-2 font-bold' : 'text-gray-400'}`}>Course Approvals</button>
        <button onClick={() => setActiveTab('transactions')} className={`pb-2 px-4 transition ${activeTab === 'transactions' ? 'text-accent-500 border-b-2 font-bold' : 'text-gray-400'}`}>Transactions</button>
      </div>

      {/* --- TAB 1: INSTRUCTOR MANAGEMENT --- */}
      {activeTab === 'instructors' && (
        <div className="w-full flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-4">
                <h2 className="text-2xl font-bold text-white mb-4">Enlisted Instructors</h2>
                {instructorsList.length === 0 ? <p className="text-gray-500">No instructors found.</p> : 
                    instructorsList.map(inst => (
                        <div key={inst._id} className="bg-dark-800 p-5 rounded-xl border border-gray-700 shadow-sm hover:border-gray-500 transition">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-white">{inst.name}</h3>
                                    <p className="text-sm text-gray-400">{inst.email}</p>
                                    <div className="mt-3">
                                        <p className="text-xs text-gray-500 uppercase mb-1">Courses ({inst.courses.length})</p>
                                        <div className="flex flex-wrap gap-2">
                                            {inst.courses.length === 0 && <span className="text-xs text-gray-600 italic">No courses</span>}
                                            {inst.courses.map(c => (
                                                <span key={c._id} className={`text-xs px-2 py-1 rounded border ${c.status === 'approved' ? 'border-green-800 text-green-400 bg-green-900/20' : 'border-yellow-800 text-yellow-400 bg-yellow-900/20'}`}>
                                                    {c.title}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDeleteInstructor(inst._id)}
                                    className="text-xs bg-red-900/50 text-red-400 border border-red-900 px-3 py-1 rounded hover:bg-red-600 hover:text-white transition"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))
                }
            </div>
            <div className="w-full md:w-1/3 bg-dark-800 p-8 rounded-2xl shadow-glow border border-gray-700 h-fit sticky top-4">
               <h2 className="text-xl font-bold mb-4 text-white text-center">Add New Instructor</h2>
               <form onSubmit={handleCreateInstructor} className="space-y-4">
                 <input className="input-field" placeholder="Name" value={instData.name} onChange={e => setInstData({...instData, name: e.target.value})} required />
                 <input className="input-field" placeholder="Email" value={instData.email} onChange={e => setInstData({...instData, email: e.target.value})} required />
                 <input className="input-field" type="password" placeholder="Password" value={instData.password} onChange={e => setInstData({...instData, password: e.target.value})} required />
                 <button className="btn-primary w-full py-2 mt-2">Create Instructor</button>
               </form>
            </div>
        </div>
      )}

      {/* --- TAB 2: COURSE CONTENT APPROVALS --- */}
      {activeTab === 'approvals' && (
        <div className="w-full max-w-5xl grid gap-6 relative">
          {pendingCourses.length === 0 ? <p className="text-center text-gray-500">No pending approvals.</p> : 
            pendingCourses.map(course => (
              <div key={course._id} className="bg-dark-800 p-6 rounded-xl border border-gray-700 shadow-glow flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{course.title}</h3>
                    <p className="text-sm text-gray-400">Instructor: <span className="text-accent-500">{course.instructorId?.name}</span></p>
                    <p className="text-sm text-gray-400">Price: ${course.price}</p>
                    <p className="text-xs text-gray-500 mt-1">{course.classes.length} Classes</p>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={() => handleApproveContent(course._id)} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition">
                        Approve Content
                      </button>
                      <button onClick={() => handleDeclineContent(course._id)} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition">
                        Decline
                      </button>
                  </div>
                </div>
                
                <div className="space-y-2 mt-2">
                    {course.classes.map((cls, idx) => (
                        <div 
                            key={idx} 
                            // UPDATED: Save the index (_idx) to force re-render when switching classes
                            onClick={() => { setViewingClass({ ...cls, _idx: idx }); setViewingCourseTitle(course.title); }}
                            className="bg-dark-900 p-3 rounded text-sm text-gray-400 cursor-pointer hover:bg-dark-700 hover:text-white transition border border-transparent hover:border-gray-600 flex justify-between"
                        >
                            <span>Class {idx+1}: {cls.video ? 'Has Video' : 'No Video'}</span>
                            <span className="text-accent-500 text-xs">Click to Preview</span>
                        </div>
                    ))}
                </div>
              </div>
            ))
          }

          {/* --- CONTENT PREVIEW SIDEBAR --- */}
          {viewingClass && (
              <div className="fixed top-0 right-0 h-full w-full md:w-1/3 bg-dark-900 border-l border-gray-700 shadow-2xl p-6 overflow-y-auto z-50 transform transition-transform">
                  <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                      <div>
                        <h2 className="text-xl font-bold text-white">Content Preview</h2>
                        <p className="text-sm text-accent-500">{viewingCourseTitle}</p>
                      </div>
                      <button onClick={() => setViewingClass(null)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                  </div>

                  <div className="space-y-6">
                      {/* Video with Robust Key */}
                      <div>
                          <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Video Material</h3>
                          {viewingClass.video ? (
                              <video 
                                key={`${viewingClass._idx}-${viewingClass.video}`} // <--- ROBUST KEY FIX
                                src={viewingClass.video} 
                                controls 
                                preload="auto" // <--- ADDED PRELOAD
                                className="w-full rounded-lg border border-gray-700" 
                              />
                          ) : <p className="text-red-500 text-sm">No Video Uploaded</p>}
                      </div>

                      {/* Audio */}
                      <div>
                          <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Audio Material</h3>
                          {viewingClass.audio ? (
                              <audio 
                                key={`${viewingClass._idx}-${viewingClass.audio}`} 
                                src={viewingClass.audio} 
                                controls 
                                className="w-full" 
                              />
                          ) : <p className="text-gray-600 text-sm">No Audio Uploaded</p>}
                      </div>

                      {/* Text */}
                      <div>
                          <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Reading Material</h3>
                          <div className="bg-dark-800 p-4 rounded border border-gray-800 text-gray-300 text-sm whitespace-pre-wrap">
                              {viewingClass.text || "No text content provided."}
                          </div>
                      </div>

                      {/* MCQs */}
                      <div>
                          <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">MCQs ({viewingClass.mcq.length})</h3>
                          {viewingClass.mcq.length === 0 ? <p className="text-gray-600 text-sm">No MCQs</p> : 
                             viewingClass.mcq.map((q, i) => (
                                 <div key={i} className="mb-4 bg-dark-800 p-3 rounded border border-gray-800">
                                     <p className="font-bold text-white mb-2">{i+1}. {q.question}</p>
                                     <ul className="list-disc pl-5 text-sm text-gray-400">
                                         {q.options.map((opt, oid) => (
                                             <li key={oid} className={opt === q.answer ? "text-green-400 font-bold" : ""}>{opt}</li>
                                         ))}
                                     </ul>
                                     <p className="text-xs text-gray-500 mt-2">Answer: {q.answer}</p>
                                 </div>
                             ))
                          }
                      </div>
                  </div>
                  
                  <button onClick={() => setViewingClass(null)} className="w-full mt-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded font-bold">Close Preview</button>
              </div>
          )}
        </div>
      )}

      {/* --- TAB 3: TRANSACTIONS --- */}
      {activeTab === 'transactions' && (
        <div className="w-full max-w-4xl bg-dark-800 p-6 rounded-xl border border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Transaction History</h2>
                {transactions.length > 0 && (
                    <button 
                        onClick={handleClearHistory} 
                        className="text-xs border border-red-500 text-red-500 px-3 py-1 rounded hover:bg-red-500 hover:text-white transition"
                    >
                        Clear History
                    </button>
                )}
            </div>

            {transactions.length === 0 ? <p className="text-gray-500 text-center">No transactions found.</p> : (
                <div className="space-y-4">
                    {transactions.map(tx => (
                        <div key={tx._id} className="flex justify-between items-center p-4 bg-dark-900 border border-gray-800 rounded-lg">
                            <div>
                                <p className="text-white font-bold">{tx.courseId?.title || "Unknown Course"}</p>
                                <p className="text-sm text-gray-400">Learner: {tx.learnerId?.name}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Purchased: {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'Date unavailable'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-bold text-white">${tx.amount}</p>
                                <span className={`text-xs px-2 py-1 rounded uppercase block mb-2 ${
                                    tx.status === 'completed' ? 'text-green-500 bg-green-900' :
                                    tx.status.includes('pending') ? 'text-yellow-500 bg-yellow-900' : 
                                    tx.status.includes('declined') ? 'text-red-500 bg-red-900' : 'text-gray-500'
                                }`}>
                                    {tx.status.replace('_', ' ')}
                                </span>
                                
                                {tx.status === 'pending_admin' && (
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => handleTxAction(tx._id, 'approve')} className="bg-green-600 px-3 py-1 rounded text-white text-xs hover:bg-green-500">Approve</button>
                                        <button onClick={() => handleTxAction(tx._id, 'decline')} className="bg-red-600 px-3 py-1 rounded text-white text-xs hover:bg-red-500">Decline</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;