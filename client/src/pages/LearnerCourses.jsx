import { useEffect, useState } from 'react';
import axios from 'axios';

const LearnerCourses = () => {
  const [courses, setCourses] = useState([]);
  const [myTransactions, setMyTransactions] = useState([]); // Store purchase history
  const [loading, setLoading] = useState(true);

  // Get user from session
  const user = JSON.parse(sessionStorage.getItem('user'));

  useEffect(() => {
    fetchApprovedCourses();
    if (user) {
        fetchMyStatus();
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

  const handleBuy = async (courseId, price) => {
      if(!user) return alert("Please login first");
      
      const confirm = window.confirm(`Confirm purchase for $${price}?`);
      if(!confirm) return;

      try {
          // We still send price for logging, but backend now uses DB price
          await axios.post('http://localhost:5000/api/learner/buy', {
              learnerId: user.id,
              courseId: courseId
          });
          alert("Order Placed! Money deducted. Waiting for Admin Approval.");
          fetchMyStatus(); 
      } catch (err) {
          alert("Purchase Failed: " + (err.response?.data?.message || err.message));
      }
  };

  // Helper to determine button state
  const getButtonState = (courseId) => {
      // Find the latest transaction for this course
      const tx = myTransactions.find(t => t.courseId === courseId);
      
      if (!tx) return 'buy'; // No transaction exists
      if (tx.status === 'completed') return 'owned';
      if (tx.status === 'pending_admin') return 'waiting_admin';
      if (tx.status === 'pending_instructor') return 'waiting_instructor';
      if (tx.status === 'declined') return 'declined'; // Can try buying again
      return 'buy';
  };

  return (
    <div className="max-w-6xl mx-auto mt-10">
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
             const status = getButtonState(course._id);

             return (
                <div key={course._id} className="bg-dark-800 rounded-xl border border-gray-700 overflow-hidden hover:border-accent-500 transition shadow-lg flex flex-col">
                    <div className="h-32 bg-gradient-to-r from-indigo-900 to-purple-900 flex items-center justify-center relative">
                        <span className="text-4xl">🎓</span>
                        {/* Status Badge on Image */}
                        {status === 'owned' && <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">OWNED</div>}
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-2">{course.title}</h3>
                        <p className="text-sm text-accent-500 mb-4">By {course.instructorId?.name || 'Instructor'}</p>
                        
                        <p className="text-gray-400 text-sm mb-6 flex-1 line-clamp-3">{course.description}</p>
                        
                        <div className="flex justify-between items-center mt-auto border-t border-gray-700 pt-4">
                            <span className="text-2xl font-bold text-white">${course.price}</span>
                            
                            {/* DYNAMIC BUTTONS */}
                            {status === 'buy' || status === 'declined' ? (
                                <button 
                                    onClick={() => handleBuy(course._id, course.price)} 
                                    className={`text-white px-4 py-2 rounded font-bold transition ${status === 'declined' ? 'bg-red-600 hover:bg-red-500' : 'bg-accent-500 hover:bg-indigo-600'}`}
                                >
                                    {status === 'declined' ? 'Declined (Retry)' : 'Buy Course'}
                                </button>
                            ) : status === 'waiting_admin' ? (
                                <button disabled className="bg-yellow-600 text-white px-4 py-2 rounded font-bold cursor-not-allowed opacity-80 text-sm">
                                    Waiting Admin
                                </button>
                            ) : status === 'waiting_instructor' ? (
                                <button disabled className="bg-blue-600 text-white px-4 py-2 rounded font-bold cursor-not-allowed opacity-80 text-sm">
                                    Waiting Instructor
                                </button>
                            ) : (
                                <button className="bg-green-600 text-white px-4 py-2 rounded font-bold cursor-default">
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
    </div>
  );
};

export default LearnerCourses;