import { useEffect, useState } from 'react';
import axios from 'axios';

const LearnerCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovedCourses();
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

  // Get user from session
  const user = JSON.parse(sessionStorage.getItem('user'));

  const handleBuy = async (courseId, price) => {
      if(!user) return alert("Please login first");
      
      const confirm = window.confirm(`Confirm purchase for $${price}?`);
      if(!confirm) return;

      try {
          await axios.post('http://localhost:5000/api/learner/buy', {
              learnerId: user.id,
              courseId: courseId,
              price: price
          });
          alert("Order Placed! Money deducted. Waiting for Admin Approval.");
      } catch (err) {
          alert("Purchase Failed: " + (err.response?.data?.message || err.message));
      }
  };

  return (
    <div className="max-w-6xl mx-auto mt-10">
      <h1 className="text-3xl font-bold text-white mb-8">Available Courses</h1>
      
      {loading ? (
        <p className="text-gray-400">Loading courses...</p>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 bg-dark-800 rounded-xl border border-gray-700">
          <p className="text-gray-400">No approved courses available yet.</p>
          <p className="text-sm text-gray-600 mt-2">Instructors are currently uploading content for approval.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.map(course => (
             <div key={course._id} className="bg-dark-800 rounded-xl border border-gray-700 overflow-hidden hover:border-accent-500 transition shadow-lg flex flex-col">
                <div className="h-32 bg-gradient-to-r from-indigo-900 to-purple-900 flex items-center justify-center">
                    <span className="text-4xl">🎓</span>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-2">{course.title}</h3>
                    <p className="text-sm text-accent-500 mb-4">By {course.instructorId?.name || 'Instructor'}</p>
                    
                    <p className="text-gray-400 text-sm mb-6 flex-1 line-clamp-3">{course.description}</p>
                    
                    <div className="flex justify-between items-center mt-auto border-t border-gray-700 pt-4">
                        <span className="text-2xl font-bold text-white">${course.price}</span>
                        <button 
                            // 👇 FIX IS HERE: Passing both the ID and the PRICE
                            onClick={() => handleBuy(course._id, course.price)} 
                            className="bg-accent-500 hover:bg-indigo-600 text-white px-4 py-2 rounded font-bold transition"
                        >
                            Buy Course
                        </button>
                    </div>
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LearnerCourses;