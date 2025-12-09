import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ContentEditor from '../components/ContentEditor';

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [courses, setCourses] = useState([]);
  const [transactions, setTransactions] = useState([]); 
  const user = JSON.parse(sessionStorage.getItem('user'));

  // --- STATE ---
  const [activeTab, setActiveTab] = useState('courses'); 
  const [step, setStep] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [courseData, setCourseData] = useState({ title: '', description: '', price: '', numClasses: '', classes: [] });

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

  const fetchHistory = async () => {
    try {
        const res = await axios.get(`http://localhost:5000/api/instructor/my-history/${user.id}`);
        setTransactions(res.data);
    } catch (err) { console.error(err); }
  };

  const handleTxAction = async (id, action) => {
    try {
        const res = await axios.post('http://localhost:5000/api/instructor/transaction-action', { transactionId: id, action });
        alert(res.data.message);
        fetchHistory(); 
        fetchBalance(); 
    } catch(err) { alert("Action Failed"); }
  };

  const handleClearHistory = async () => {
      if(!window.confirm("Clear all Completed and Declined transactions? (Pending requests will be kept)")) return;
      try {
          await axios.delete(`http://localhost:5000/api/instructor/clear-history/${user.id}`);
          fetchHistory(); 
          alert("History Cleared!");
      } catch (err) { alert("Failed to clear history"); }
  };

  const handleDelete = async (courseId) => {
    if(!window.confirm("Are you sure?")) return;
    try {
        await axios.delete(`http://localhost:5000/api/instructor/delete/${courseId}`);
        alert("Course Deleted");
        fetchCourses();
    } catch (err) { alert(err.response?.data?.message || "Delete failed"); }
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
        alert("Please fill in all fields before proceeding.");
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
      try {
        if (isEditing && editingCourseId) {
            await axios.put(`http://localhost:5000/api/instructor/update/${editingCourseId}`, { 
                ...courseData, 
                instructorId: user.id 
            });
            alert("Course Updated! Sent for Admin Approval.");
        } else {
            await axios.post('http://localhost:5000/api/instructor/upload', { 
                ...courseData, 
                instructorId: user.id 
            });
            alert("Course Submitted! Pending Admin Approval.");
        }
        setStep(1); 
        setIsEditing(false); 
        setEditingCourseId(null);
        setCourseData({ title: '', description: '', price: '', numClasses: '', classes: [] });
        fetchCourses();
      } catch (err) { alert("Submission Failed: " + (err.response?.data?.message || err.message)); }
  };

  const cancelEdit = () => { setStep(1); setIsEditing(false); setEditingCourseId(null); setCourseData({ title: '', description: '', price: '', numClasses: '', classes: [] }); };

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
          <p className="text-4xl font-mono text-accent-500 font-bold mt-2">৳{balance}</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-4 mb-6 border-b border-gray-700 pb-2">
        <button onClick={() => setActiveTab('courses')} className={`pb-2 px-4 ${activeTab === 'courses' ? 'text-accent-500 border-b-2 border-accent-500' : 'text-gray-400'}`}>Manage Courses</button>
        <button onClick={() => { setActiveTab('history'); fetchHistory(); }} className={`pb-2 px-4 ${activeTab === 'history' ? 'text-accent-500 border-b-2 border-accent-500' : 'text-gray-400'}`}>Transaction History</button>
      </div>

      {/* --- TAB 1: COURSES --- */}
      {activeTab === 'courses' && (
        <>
            {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-dark-800 p-6 rounded-xl border border-gray-700">
                        <h2 className="text-xl font-bold mb-6 text-white border-b border-gray-700 pb-2">{isEditing ? `Editing: ${courseData.title}` : "Course Info"}</h2>
                        <form onSubmit={handleStep1Submit} className="space-y-4">
                            <input className="input-field" placeholder="Course Title" value={courseData.title} onChange={e => setCourseData({...courseData, title: e.target.value})} required />
                            <div className="grid grid-cols-2 gap-4">
                                <input className="input-field" type="number" placeholder="Price (৳)" value={courseData.price} onChange={e => setCourseData({...courseData, price: e.target.value})} required />
                                <input className="input-field" type="number" placeholder="Number of Classes" min="1" max="50" value={courseData.numClasses} onChange={e => setCourseData({...courseData, numClasses: e.target.value})} required />
                            </div>
                            <textarea className="input-field h-32" placeholder="Description" value={courseData.description} onChange={e => setCourseData({...courseData, description: e.target.value})} required />
                            <div className="flex gap-2">
                                <button className="btn-primary w-full mt-4">Next: Add Content →</button>
                                {isEditing && <button type="button" onClick={cancelEdit} className="mt-4 px-4 py-2 border border-gray-500 text-gray-400 rounded hover:text-white">Cancel</button>}
                            </div>
                        </form>
                    </div>
                    <div className="bg-dark-800 p-6 rounded-xl border border-gray-700">
                        <h2 className="text-xl font-bold mb-6 text-white border-b border-gray-700 pb-2">My Uploaded Courses</h2>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto">
                            {courses.map(c => (
                                <div key={c._id} className="p-4 bg-dark-900 rounded border border-gray-800">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-white font-bold">{c.title}</span>
                                        <span className={`text-xs px-2 py-1 rounded ${c.status === 'approved' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>{c.status}</span>
                                    </div>
                                    {c.status !== 'approved' && (
                                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-800">
                                            <button onClick={() => handleEdit(c)} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded">Edit</button>
                                            <button onClick={() => handleDelete(c._id)} className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded">Delete</button>
                                        </div>
                                    )}
                                    {c.status === 'approved' && <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500 italic">This course is live and locked.</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {step === 2 && <ContentEditor courseData={courseData} setCourseData={setCourseData} onBack={cancelEdit} onFinalSubmit={handleFinalSubmit} />}
        </>
      )}

      {/* --- TAB 2: TRANSACTION HISTORY --- */}
      {activeTab === 'history' && (
        <div className="bg-dark-800 p-6 rounded-xl border border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Course Orders & Payouts</h2>
                {transactions.length > 0 && <button onClick={handleClearHistory} className="text-xs border border-red-500 text-red-500 px-3 py-1 rounded hover:bg-red-500 hover:text-white transition">Clear History</button>}
            </div>
            {transactions.length === 0 ? <p className="text-gray-500">No active transactions found.</p> : (
                <div className="space-y-3">
                    {transactions.map(tx => (
                        <div key={tx._id} className="flex justify-between items-center p-4 bg-dark-900 border border-gray-800 rounded-lg hover:border-gray-600 transition">
                            <div>
                                <h3 className="text-white font-bold text-lg">{tx.courseId?.title || "Course Unavailable"}</h3>
                                <div className="text-sm text-gray-400 mt-2 space-y-1">
                                    <p>Learner: <span className="text-accent-500 font-bold">{tx.learnerId?.name}</span> ({tx.learnerId?.email})</p>
                                    <p className="text-xs text-gray-500">Purchased: {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}</p>
                                    <p className="text-xs text-gray-500">Admin Approved: {tx.adminApprovedAt ? new Date(tx.adminApprovedAt).toLocaleString() : 'Pending/N/A'}</p>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                                <p className="text-xl font-bold text-white">৳{tx.amount}</p>
                                <span className={`text-xs px-3 py-1 rounded-full uppercase font-bold tracking-wide ${
                                    tx.status === 'completed' ? 'bg-green-900 text-green-400' :
                                    tx.status === 'pending_instructor' ? 'bg-yellow-900 text-yellow-400' :
                                    tx.status.includes('declined') ? 'bg-red-900 text-red-400' : 'bg-gray-800 text-gray-400'
                                }`}>{tx.status === 'declined_instructor' ? 'DECLINED' : tx.status.replace('_', ' ')}</span>
                                {tx.status === 'pending_instructor' && (
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={() => handleTxAction(tx._id, 'approve')} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-bold shadow-lg transition">Accept Payment</button>
                                        <button onClick={() => handleTxAction(tx._id, 'decline')} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm font-bold shadow-lg transition">Reject</button>
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

export default InstructorDashboard;