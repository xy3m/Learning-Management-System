import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('instructors');
  
  // Data States
  const [instData, setInstData] = useState({ name: '', email: '', password: '' });
  const [pendingCourses, setPendingCourses] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Fetch Data based on active tab
  useEffect(() => {
    if (activeTab === 'approvals') fetchPendingCourses();
    if (activeTab === 'transactions') fetchTransactions();
  }, [activeTab]);

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

  const handleApprove = async (courseId) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/approve/${courseId}`);
      alert("Course Approved! Instructor Paid.");
      fetchPendingCourses(); // Refresh list
    } catch (err) {
      alert("Approval failed.");
    }
  };

  const handleCreateInstructor = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/create-instructor', instData);
      alert("Instructor Created Successfully!");
      setInstData({ name: '', email: '', password: '' });
    } catch (err) { alert("Failed to create instructor."); }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-8 px-4">
         <h1 className="text-4xl font-bold text-white">LMS Admin Panel</h1>
         <button onClick={handleLogout} className="text-red-500 hover:text-white border border-red-500 px-4 py-1 rounded">Logout</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 mb-8 border-b border-gray-700 pb-2 w-full justify-center">
        <button onClick={() => setActiveTab('instructors')} className={`pb-2 px-4 transition ${activeTab === 'instructors' ? 'text-accent-500 border-b-2 font-bold' : 'text-gray-400'}`}>Instructor Management</button>
        <button onClick={() => setActiveTab('approvals')} className={`pb-2 px-4 transition ${activeTab === 'approvals' ? 'text-accent-500 border-b-2 font-bold' : 'text-gray-400'}`}>Course Approvals</button>
        <button onClick={() => setActiveTab('transactions')} className={`pb-2 px-4 transition ${activeTab === 'transactions' ? 'text-accent-500 border-b-2 font-bold' : 'text-gray-400'}`}>Transactions</button>
      </div>

      {/* --- TAB 1: INSTRUCTOR MANAGEMENT --- */}
      {activeTab === 'instructors' && (
        <div className="bg-dark-800 p-10 rounded-2xl shadow-glow border border-gray-700 w-full max-w-lg">
           <h2 className="text-2xl font-bold mb-4 text-white text-center">Add New Instructor</h2>
           <form onSubmit={handleCreateInstructor} className="space-y-5">
             <input className="input-field" placeholder="Name" value={instData.name} onChange={e => setInstData({...instData, name: e.target.value})} />
             <input className="input-field" placeholder="Email" value={instData.email} onChange={e => setInstData({...instData, email: e.target.value})} />
             <input className="input-field" type="password" placeholder="Password" value={instData.password} onChange={e => setInstData({...instData, password: e.target.value})} />
             <button className="btn-primary w-full py-3 mt-4">Create Instructor</button>
           </form>
        </div>
      )}

      {/* --- TAB 2: COURSE APPROVALS --- */}
      {activeTab === 'approvals' && (
        <div className="w-full max-w-5xl grid gap-6">
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
                  <button onClick={() => handleApprove(course._id)} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition">
                    Approve & Pay
                  </button>
                </div>

                {/* Class Content Preview (Iterating through Classes) */}
                <div className="space-y-3 mt-2">
                    {course.classes.map((cls, idx) => (
                        <div key={idx} className="bg-dark-900 p-4 rounded-lg border border-gray-800 text-sm">
                            <h4 className="text-accent-500 font-bold mb-2">Class {idx + 1} Content</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-gray-500 font-bold">Video:</p>
                                    {cls.video ? (
                                        <a href={cls.video} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline truncate block w-64">{cls.video}</a>
                                    ) : <span className="text-red-500">Missing</span>}
                                </div>
                                <div>
                                    <p className="text-gray-500 font-bold">Audio:</p>
                                    {cls.audio ? (
                                        <a href={cls.audio} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline truncate block w-64">{cls.audio}</a>
                                    ) : <span className="text-gray-600">None</span>}
                                </div>
                                {cls.text && (
                                    <div className="col-span-2">
                                        <p className="text-gray-500 font-bold">Text:</p>
                                        <p className="text-gray-400 truncate">{cls.text}</p>
                                    </div>
                                )}
                                {cls.mcq && cls.mcq.length > 0 && (
                                    <div className="col-span-2">
                                        <p className="text-gray-500 font-bold">MCQs:</p>
                                        <p className="text-gray-400">{cls.mcq.length} Questions</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* --- TAB 3: TRANSACTIONS --- */}
      {activeTab === 'transactions' && (
        <div className="w-full max-w-4xl bg-dark-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">Transaction History</h2>
            {transactions.length === 0 ? <p className="text-gray-500 text-center">No transactions found.</p> : (
                <div className="space-y-4">
                    {transactions.map(tx => (
                        <div key={tx._id} className="flex justify-between items-center p-4 bg-dark-900 border border-gray-800 rounded-lg">
                            <div>
                                <p className="text-white font-bold">{tx.courseId?.title || "Unknown Course"}</p>
                                <p className="text-sm text-gray-400">Learner: {tx.learnerId?.name}</p>
                                <p className="text-xs text-gray-500">ID: {tx._id}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-bold text-white">${tx.amount}</p>
                                <span className={`text-xs px-2 py-1 rounded uppercase ${
                                    tx.status === 'completed' ? 'text-green-500 bg-green-900' :
                                    tx.status.includes('pending') ? 'text-yellow-500 bg-yellow-900' : 'text-gray-500'
                                }`}>
                                    {tx.status.replace('_', ' ')}
                                </span>
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