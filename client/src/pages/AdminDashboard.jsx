import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('transactions'); 
  
  // Data States
  const [balance, setBalance] = useState(0);
  const [instData, setInstData] = useState({ name: '', email: '', password: '' });
  const [pendingCourses, setPendingCourses] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Get Admin User ID
  const user = JSON.parse(sessionStorage.getItem('user'));

  // Fetch Data based on active tab
  useEffect(() => {
    fetchBalance(); // Always fetch balance
    if (activeTab === 'approvals') fetchPendingCourses();
    if (activeTab === 'transactions') fetchTransactions();
  }, [activeTab]);

  const fetchBalance = async () => {
    if(!user) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/bank/balance/${user.id}`);
      setBalance(res.data.balance);
    } catch (err) { 
        console.log("Admin bank likely not initialized yet.");
        setBalance(0); 
    }
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

  const handleApproveContent = async (courseId) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/approve/${courseId}`);
      alert("Content Approved! Now visible to Learners.");
      fetchPendingCourses(); 
    } catch (err) { alert("Approval failed."); }
  };

  // ACTION: Approve Purchase
  const handleTxAction = async (id, action) => {
    try {
        const res = await axios.post('http://localhost:5000/api/admin/transaction-action', { transactionId: id, action });
        alert(res.data.message);
        fetchTransactions();
        fetchBalance(); // Update Admin Balance immediately
    } catch(err) { alert("Action failed"); }
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
      
      {/* HEADER WITH BALANCE */}
      <div className="w-full bg-dark-800 p-8 rounded-xl shadow-glow mb-8 flex justify-between items-center border border-gray-700">
        <div>
          <h1 className="text-3xl font-bold text-white">LMS Admin Panel</h1>
          <p className="text-gray-400">System Management</p>
        </div>
        
        {/* MODIFIED SECTION: Removed Button & Renamed Label */}
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

      {/* --- TAB 2: COURSE CONTENT APPROVALS --- */}
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
                  <button onClick={() => handleApproveContent(course._id)} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition">
                    Approve Content
                  </button>
                </div>
                <div className="space-y-2 mt-2">
                    {course.classes.map((cls, idx) => (
                        <div key={idx} className="bg-dark-900 p-3 rounded text-sm text-gray-400">
                            Class {idx+1}: {cls.video ? 'Has Video' : 'No Video'}
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
                                <span className={`text-xs px-2 py-1 rounded uppercase block mb-2 ${
                                    tx.status === 'completed' ? 'text-green-500 bg-green-900' :
                                    tx.status.includes('pending') ? 'text-yellow-500 bg-yellow-900' : 'text-gray-500'
                                }`}>
                                    {tx.status.replace('_', ' ')}
                                </span>
                                
                                {/* ADMIN APPROVAL BUTTONS */}
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