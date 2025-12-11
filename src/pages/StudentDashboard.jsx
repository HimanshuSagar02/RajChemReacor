import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { serverUrl } from "../App";
import LiveVideoPlayer from "../components/LiveVideoPlayer";
import LiveKitPlayer from "../components/LiveKitPlayer";
import { FaBook, FaClipboardList, FaBell, FaGraduationCap, FaUser, FaEnvelope, FaClock, FaCalendarCheck, FaVideo } from "react-icons/fa";

function StudentDashboard() {
  const { userData } = useSelector((state) => state.user);
  const { courseData } = useSelector((state) => state.course);

  const [activeTab, setActiveTab] = useState("notifications");

  // Safety check - show loading if userData is not available
  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Assignments state
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [submitForm, setSubmitForm] = useState({});
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // Shared course notes
  const [sharedNotes, setSharedNotes] = useState([]);
  const [sharedNoteForm, setSharedNoteForm] = useState({ title: "", content: "", courseId: "" });
  const [sharedFile, setSharedFile] = useState(null);

  // Attendance
  const [attendance, setAttendance] = useState([]);

  // Live Classes
  const [liveClasses, setLiveClasses] = useState([]);
  const [loadingLiveClasses, setLoadingLiveClasses] = useState(false);

  // Grades
  const [grades, setGrades] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);

  // Video Player
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [currentLiveClassId, setCurrentLiveClassId] = useState(null);
  const [currentPlatformType, setCurrentPlatformType] = useState("portal");

  const enrolledCourses = useMemo(() => {
    const ids = (userData?.enrolledCourses || []).map((c) =>
      typeof c === "string" ? c : c._id
    );
    return courseData?.filter((c) => ids.includes(c._id)) || [];
  }, [userData, courseData]);

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const res = await axios.get(`${serverUrl}/api/notifications/my`, {
        withCredentials: true,
      });
      setNotifications(res.data || []);
    } catch (error) {
      toast.error("Failed to fetch notifications");
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.post(`${serverUrl}/api/notifications/${notificationId}/read`, {}, { withCredentials: true });
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      // silent
    }
  };

  const fetchAssignments = async () => {
    if (!enrolledCourses.length) return;
    setLoadingAssignments(true);
    try {
      const requests = enrolledCourses.map((c) =>
        axios.get(`${serverUrl}/api/assignments/${c._id}`, { withCredentials: true })
      );
      const results = await Promise.all(requests);
      const list = [];
      results.forEach((res, idx) => {
        const course = enrolledCourses[idx];
        (res.data || []).forEach((a) => list.push({ ...a, course }));
      });
      setAssignments(list);

      // fetch submissions for each assignment
      const submissionPairs = await Promise.all(
        list.map((a) =>
          axios
            .get(`${serverUrl}/api/assignments/${a._id}/my`, { withCredentials: true })
            .then((r) => [a._id, r.data])
            .catch(() => [a._id, null])
        )
      );
      setSubmissions(Object.fromEntries(submissionPairs));
    } catch (error) {
      toast.error("Failed to fetch assignments");
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrolledCourses.length]);

  const fetchSharedNotes = async () => {
    try {
      // For students, show notes from all enrolled courses
      // For educators, allow filtering by course
      const params = {};
      if (userData?.role === "educator" || userData?.role === "admin") {
        if (sharedNoteForm.courseId) params.courseId = sharedNoteForm.courseId;
      }
      // Students will get filtered notes from backend (only enrolled courses)
      const res = await axios.get(`${serverUrl}/api/sharednotes`, {
        params,
        withCredentials: true,
      });
      setSharedNotes(res.data || []);
    } catch (error) {
      toast.error("Failed to fetch shared notes");
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/attendance/my`, {
        withCredentials: true,
      });
      const attendanceData = res.data || [];
      // Populate course information using Redux courseData if available, otherwise fetch from API
      const attendanceWithCourses = await Promise.all(
        attendanceData.map(async (a) => {
          if (a.courseId && typeof a.courseId === 'string') {
            // First try to find course in Redux store
            const courseFromStore = courseData?.find(c => c._id === a.courseId);
            if (courseFromStore) {
              return { ...a, courseId: courseFromStore };
            }
            // If not in store, fetch from API
            try {
              const courseRes = await axios.get(`${serverUrl}/api/course/${a.courseId}`, {
                withCredentials: true,
              });
              return { ...a, courseId: courseRes.data };
            } catch {
              return a;
            }
          }
          return a;
        })
      );
      setAttendance(attendanceWithCourses);
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
      toast.error("Failed to fetch attendance records");
    }
  };

  useEffect(() => {
    fetchSharedNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedNoteForm.courseId]);

  useEffect(() => {
    fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLiveClasses = async () => {
    setLoadingLiveClasses(true);
    try {
      const res = await axios.get(`${serverUrl}/api/liveclass/my`, {
        withCredentials: true,
      });
      setLiveClasses(res.data || []);
    } catch (error) {
      toast.error("Failed to fetch live classes");
    } finally {
      setLoadingLiveClasses(false);
    }
  };

  useEffect(() => {
    if (activeTab === "liveclasses") {
      fetchLiveClasses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchGrades = async () => {
    setLoadingGrades(true);
    try {
      const res = await axios.get(`${serverUrl}/api/grades/my`, {
        withCredentials: true,
      });
      setGrades(res.data || []);
    } catch (error) {
      toast.error("Failed to fetch grades");
    } finally {
      setLoadingGrades(false);
    }
  };

  useEffect(() => {
    if (activeTab === "grades") {
      fetchGrades();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);


  const handleSubmitAssignment = async (assignmentId) => {
    const payload = submitForm[assignmentId] || {};
    try {
      const formData = new FormData();
      if (payload.submissionUrl) formData.append("submissionUrl", payload.submissionUrl);
      if (payload.attachment) formData.append("attachment", payload.attachment);
      if (payload.comment) formData.append("comment", payload.comment);
      const res = await axios.post(
        `${serverUrl}/api/assignments/${assignmentId}/submit`,
        formData,
        { withCredentials: true }
      );
      setSubmissions((prev) => ({ ...prev, [assignmentId]: res.data.submission || res.data }));
      
      if (res.data.alreadySubmitted) {
        toast.info("Assignment submission updated successfully");
      } else {
        toast.success("Assignment submitted successfully");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Submit failed");
    }
  };

  const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : "No due date");

  const uploadSharedNote = async () => {
    if (!sharedNoteForm.title || !sharedNoteForm.courseId) {
      toast.error("Course and title required");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("title", sharedNoteForm.title);
      formData.append("courseId", sharedNoteForm.courseId);
      if (sharedNoteForm.content) formData.append("content", sharedNoteForm.content);
      if (sharedFile) formData.append("file", sharedFile);
      await axios.post(`${serverUrl}/api/sharednotes`, formData, { withCredentials: true });
      toast.success("Note uploaded");
      setSharedNoteForm({ title: "", content: "", courseId: sharedNoteForm.courseId });
      setSharedFile(null);
      fetchSharedNotes();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Upload failed");
    }
  };

  // Calculate statistics
  const totalEnrolledCourses = enrolledCourses.length;
  const totalAssignments = assignments.length;
  const completedAssignments = Object.values(submissions).filter(s => s?.status === "submitted" || s?.status === "graded").length;
  const totalNotifications = notifications.length;
  const unreadNotifications = notifications.filter(n => !n.isRead).length;
  const totalLiveClasses = liveClasses.length;
  const upcomingLiveClasses = liveClasses.filter(lc => {
    const scheduledDate = new Date(lc.scheduledDate);
    return scheduledDate > new Date() && lc.status === "scheduled";
  }).length;

  // Calculate average grade if grades exist
  const averageGrade = grades.length > 0
    ? Math.round(grades.reduce((sum, g) => sum + (g.percentage || 0), 0) / grades.length)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 pt-24 pb-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Student Profile Header */}
        <div className="bg-gradient-to-r from-black via-gray-900 to-black rounded-2xl shadow-2xl p-8 mb-8 border-2 border-[#FFD700] relative overflow-hidden">
          {/* Decorative Elements */}
          <div className='absolute top-0 right-0 w-64 h-64 bg-[#FFD700] opacity-10 rounded-full blur-3xl'></div>
          <div className='absolute bottom-0 left-0 w-64 h-64 bg-[#FFD700] opacity-10 rounded-full blur-3xl'></div>
          
          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="w-32 h-32 rounded-full bg-[#FFD700] flex items-center justify-center border-4 border-white shadow-2xl">
              {userData?.photoUrl ? (
                <img
                  src={userData.photoUrl}
                  alt="Student"
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-4xl font-bold text-[#FFD700]" style={{ display: userData?.photoUrl ? 'none' : 'flex' }}>
                {userData?.name?.charAt(0)?.toUpperCase() || "S"}
              </div>
            </div>
            <div className="text-center md:text-left space-y-3 flex-1">
              <div>
                <h1 className="text-4xl font-bold text-[#FFD700] mb-2">
                  Welcome, {userData?.name || "Student"} 👋
                </h1>
                {userData?.class && (
                  <span className="inline-block px-4 py-1 bg-[#FFD700] text-black rounded-full text-sm font-semibold mb-2">
                    {userData.class} Grade
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-white">
                  <FaEnvelope className="text-[#FFD700]" />
                  <span className="font-semibold text-[#FFD700]">Email:</span>
                  <span className="text-gray-200">{userData?.email || "N/A"}</span>
                </div>
                {userData?.subject && (
                  <div className="flex items-center gap-2 text-white">
                    <FaBook className="text-[#FFD700]" />
                    <span className="font-semibold text-[#FFD700]">Subject:</span>
                    <span className="text-gray-200">{userData.subject}</span>
                  </div>
                )}
                {userData?.totalActiveMinutes && (
                  <div className="flex items-center gap-2 text-white">
                    <FaClock className="text-[#FFD700]" />
                    <span className="text-gray-200">Activity: {Math.round((userData.totalActiveMinutes || 0) / 60)} hours</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-white to-yellow-50 rounded-2xl shadow-xl p-6 border-2 border-[#FFD700] hover:shadow-2xl transition-all hover:scale-105 hover:border-[#FFC107] relative overflow-hidden group">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFD700] opacity-10 rounded-full -mr-12 -mt-12 group-hover:opacity-20 transition-opacity"></div>
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-[#FFD700] to-[#FFC107] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <FaBook className="text-white text-2xl" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 uppercase tracking-wide">My Courses</p>
                  <p className="text-xs font-medium text-gray-500 mt-0.5">Enrolled Programs</p>
                </div>
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-4xl font-black text-black mb-1 tracking-tight">{totalEnrolledCourses}</p>
              <p className="text-xs font-bold text-[#FFD700] uppercase tracking-wider mt-2">Active Learning</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 border-2 border-black hover:shadow-2xl transition-all hover:scale-105 hover:border-gray-700 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-black opacity-5 rounded-full -mr-12 -mt-12 group-hover:opacity-10 transition-opacity"></div>
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-black to-gray-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <FaClipboardList className="text-white text-2xl" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 uppercase tracking-wide">My Tasks</p>
                  <p className="text-xs font-medium text-gray-500 mt-0.5">Assignments</p>
                </div>
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-4xl font-black text-black mb-1 tracking-tight">
                {completedAssignments}/{totalAssignments}
              </p>
              <p className="text-xs font-bold text-black uppercase tracking-wider mt-2">Completed Tasks</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-yellow-50 rounded-2xl shadow-xl p-6 border-2 border-[#FFD700] hover:shadow-2xl transition-all hover:scale-105 hover:border-[#FFC107] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFD700] opacity-10 rounded-full -mr-12 -mt-12 group-hover:opacity-20 transition-opacity"></div>
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-[#FFD700] to-[#FFC107] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <FaBell className="text-white text-2xl" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 uppercase tracking-wide">Alerts</p>
                  <p className="text-xs font-medium text-gray-500 mt-0.5">Notifications</p>
                </div>
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-4xl font-black text-black mb-1 tracking-tight">{totalNotifications}</p>
              {unreadNotifications > 0 ? (
                <p className="text-xs font-bold text-red-600 uppercase tracking-wider mt-2">{unreadNotifications} Unread</p>
              ) : (
                <p className="text-xs font-bold text-[#FFD700] uppercase tracking-wider mt-2">All Read</p>
              )}
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 border-2 border-black hover:shadow-2xl transition-all hover:scale-105 hover:border-gray-700 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-black opacity-5 rounded-full -mr-12 -mt-12 group-hover:opacity-10 transition-opacity"></div>
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-black to-gray-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <FaGraduationCap className="text-white text-2xl" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 uppercase tracking-wide">Performance</p>
                  <p className="text-xs font-medium text-gray-500 mt-0.5">Average Grade</p>
                </div>
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-4xl font-black text-black mb-1 tracking-tight">
                {averageGrade !== null ? `${averageGrade}%` : "N/A"}
              </p>
              <p className="text-xs font-bold text-black uppercase tracking-wider mt-2">Overall Score</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-3 mb-8 pb-4 border-b-2 border-gray-200">
            <button
              onClick={() => setActiveTab("notifications")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                activeTab === "notifications" 
                  ? "bg-black text-[#FFD700] shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaBell /> Notifications
            </button>
            <button
              onClick={() => setActiveTab("assignments")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                activeTab === "assignments" 
                  ? "bg-black text-[#FFD700] shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaClipboardList /> Assignments
            </button>
            <button
              onClick={() => setActiveTab("shared")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                activeTab === "shared" 
                  ? "bg-black text-[#FFD700] shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaBook /> Shared Notes
            </button>
            <button
              onClick={() => setActiveTab("attendance")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                activeTab === "attendance" 
                  ? "bg-black text-[#FFD700] shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaCalendarCheck /> Attendance
            </button>
            <button
              onClick={() => setActiveTab("liveclasses")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                activeTab === "liveclasses" 
                  ? "bg-black text-[#FFD700] shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaVideo /> Live Classes
            </button>
            <button
              onClick={() => setActiveTab("grades")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                activeTab === "grades" 
                  ? "bg-black text-[#FFD700] shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaGraduationCap /> My Grades
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "notifications" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FFD700] bg-opacity-20 rounded-lg flex items-center justify-center">
                  <FaBell className="text-[#FFD700] text-xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Notifications & Events</h2>
              </div>
              <button
                onClick={fetchNotifications}
                className="px-4 py-2 bg-black text-[#FFD700] font-semibold rounded-xl hover:bg-gray-900 transition-all flex items-center gap-2"
              >
                <FaBell className="text-sm" /> Refresh
              </button>
            </div>
            {loadingNotifications && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700] mx-auto mb-4"></div>
                <p className="text-gray-500 text-lg">Loading notifications...</p>
              </div>
            )}
            {!loadingNotifications && notifications.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <FaBell className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-semibold">No notifications yet.</p>
                <p className="text-gray-400 text-sm mt-2">You'll see announcements and events here.</p>
              </div>
            )}
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`border rounded-lg p-4 shadow-sm transition-all ${
                    !notif.isRead
                      ? "bg-blue-50 border-blue-200 border-l-4 border-l-blue-500"
                      : "bg-white border-gray-200"
                  }`}
                  onClick={() => {
                    if (!notif.isRead) {
                      markNotificationAsRead(notif._id);
                    }
                  }}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-3 py-1 text-xs rounded-full font-semibold ${
                            notif.type === "event"
                              ? "bg-black text-[#FFD700]"
                              : notif.type === "assignment"
                              ? "bg-[#FFD700] text-black"
                              : "bg-black text-[#FFD700]"
                          }`}
                        >
                          {notif.type === "event"
                            ? "📅 Event"
                            : notif.type === "assignment"
                            ? "📝 Assignment"
                            : "📢 Announcement"}
                        </span>
                        {!notif.isRead && (
                          <span className="w-3 h-3 bg-[#FFD700] rounded-full animate-pulse"></span>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg">{notif.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {notif.createdBy?.name || "System"}
                        {notif.courseId?.title && ` • ${notif.courseId.title}`}
                        {notif.eventDate && ` • ${formatDate(notif.eventDate)}`}
                      </p>
                      <p className="text-gray-700 mt-2 whitespace-pre-wrap">{notif.message}</p>
                      {notif.eventDate && (
                        <p className="text-sm text-gray-500 mt-2">
                          📅 Event Date: {new Date(notif.eventDate).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDate(notif.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {activeTab === "assignments" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#FFD700] bg-opacity-20 rounded-lg flex items-center justify-center">
                <FaClipboardList className="text-[#FFD700] text-xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">My Assignments</h2>
            </div>
            {loadingAssignments && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700] mx-auto mb-4"></div>
                <p className="text-gray-500">Loading assignments...</p>
              </div>
            )}
            {!loadingAssignments && assignments.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <FaClipboardList className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-semibold">No assignments yet.</p>
                <p className="text-gray-400 text-sm mt-2">Assignments from your enrolled courses will appear here.</p>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              {assignments.map((a) => {
                const sub = submissions[a._id];
                const payload = submitForm[a._id] || {};
                return (
                  <div key={a._id} className="border-2 border-gray-200 rounded-xl p-5 shadow-md bg-white hover:shadow-xl hover:border-[#FFD700] transition-all">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#FFD700] bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FaClipboardList className="text-[#FFD700] text-xl" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-semibold mb-1 flex items-center gap-1">
                          <FaBook className="text-[#FFD700]" /> {a.course?.title || "Course"}
                        </p>
                        <h3 className="text-lg font-bold text-gray-900">{a.title}</h3>
                        <p className="text-sm text-gray-700 mt-2">{a.description}</p>
                        <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                          <FaClock className="text-[#FFD700]" /> Due: {formatDate(a.dueDate)}
                        </p>
                      </div>
                    </div>
                    {a.resourceUrl && (
                      <a
                        className="text-sm text-blue-600 underline"
                        href={a.resourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Resource
                      </a>
                    )}
                    {a.attachmentUrl && (
                      <a
                        className="text-sm text-blue-600 underline ml-2"
                        href={a.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Attachment
                      </a>
                    )}

                    <div className="mt-3 space-y-2">
                      <input
                        className="w-full border rounded-lg p-2 text-sm text-black"
                        placeholder="Submission URL"
                        value={payload.submissionUrl || ""}
                        onChange={(e) =>
                          setSubmitForm((p) => ({
                            ...p,
                            [a._id]: { ...p[a._id], submissionUrl: e.target.value },
                          }))
                        }
                      />
                      <input
                        type="file"
                        className="w-full border rounded-lg p-2 text-sm text-black"
                        onChange={(e) =>
                          setSubmitForm((p) => ({
                            ...p,
                            [a._id]: { ...p[a._id], attachment: e.target.files[0] },
                          }))
                        }
                      />
                      <input
                        className="w-full border rounded-lg p-2 text-sm text-black"
                        placeholder="Attachment URL (optional)"
                        value={payload.attachmentUrl || ""}
                        onChange={(e) =>
                          setSubmitForm((p) => ({
                            ...p,
                            [a._id]: { ...p[a._id], attachmentUrl: e.target.value },
                          }))
                        }
                      />
                      <textarea
                        className="w-full border rounded-lg p-2 text-sm text-black"
                        placeholder="Comment (optional)"
                        value={payload.comment || ""}
                        onChange={(e) =>
                          setSubmitForm((p) => ({
                            ...p,
                            [a._id]: { ...p[a._id], comment: e.target.value },
                          }))
                        }
                      />
                      <button
                        onClick={() => handleSubmitAssignment(a._id)}
                        className="w-full py-2 rounded-lg bg-black text-white"
                      >
                        Submit / Update
                      </button>
                    </div>

                    {sub && (
                      <div className="mt-3 border-t pt-2 text-sm text-gray-700">
                        <p>Status: {sub.status}</p>
                        {sub.score !== undefined && <p>Score: {sub.score}</p>}
                        {sub.feedback && <p>Feedback: {sub.feedback}</p>}
                        {sub.attachmentUrl && (
                          <a
                            className="text-blue-600 underline"
                            href={sub.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Download submission
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {activeTab === "shared" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#FFD700] bg-opacity-20 rounded-lg flex items-center justify-center">
                <FaBook className="text-[#FFD700] text-xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Shared Notes</h2>
            </div>
            {userData?.role === "educator" || userData?.role === "admin" ? (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3 bg-gray-50 rounded-xl p-5 border-2 border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FaBook className="text-[#FFD700]" /> Upload Shared Note
                  </h3>
                  <select
                    className="w-full border rounded-lg p-2 text-black"
                    value={sharedNoteForm.courseId}
                    onChange={(e) => setSharedNoteForm((p) => ({ ...p, courseId: e.target.value }))}
                  >
                    <option value="">Select course</option>
                    {enrolledCourses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                  <input
                    className="w-full border rounded-lg p-2 text-black"
                    placeholder="Title"
                    value={sharedNoteForm.title}
                    onChange={(e) => setSharedNoteForm((p) => ({ ...p, title: e.target.value }))}
                  />
                  <textarea
                    className="w-full border rounded-lg p-2 min-h-[120px] text-black"
                    placeholder="Content (optional)"
                    value={sharedNoteForm.content}
                    onChange={(e) => setSharedNoteForm((p) => ({ ...p, content: e.target.value }))}
                  />
                  <input
                    type="file"
                    className="w-full border rounded-lg p-2 text-black"
                    onChange={(e) => setSharedFile(e.target.files[0])}
                  />
                  <button onClick={uploadSharedNote} className="px-4 py-2 bg-black text-white rounded-lg">
                    Upload Note
                  </button>
                </div>
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold">Shared Notes</h2>
                  <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                    {sharedNotes.length === 0 && <p className="text-gray-500">No shared notes.</p>}
                    {sharedNotes.map((n) => (
                      <div key={n._id} className="border rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-500">
                          {formatDate(n.createdAt)} • {n.uploaderId?.name || "User"}
                          {n.courseId?.title && ` • ${n.courseId.title}`}
                        </p>
                        <h3 className="font-semibold">{n.title}</h3>
                        {n.content && <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{n.content}</p>}
                        {n.fileUrl && (
                          <a
                            className="text-blue-600 underline text-sm mt-2 inline-block"
                            href={n.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            download
                          >
                            📥 Download file
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Shared Notes from Educators</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Download notes uploaded by your course educators. Only educators can upload notes.
                </p>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {sharedNotes.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No shared notes available for your enrolled courses.</p>
                  )}
                  {sharedNotes.map((n) => (
                    <div key={n._id} className="border rounded-lg p-4 shadow-sm bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs text-gray-500">
                            {formatDate(n.createdAt)} • {n.uploaderId?.name || "Educator"}
                            {n.courseId?.title && ` • ${n.courseId.title}`}
                          </p>
                          <h3 className="font-semibold text-lg mt-1">{n.title}</h3>
                        </div>
                      </div>
                      {n.content && (
                        <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                          {n.content}
                        </p>
                      )}
                      {n.fileUrl && (
                        <div className="mt-3">
                          <a
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            href={n.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            download
                          >
                            <span>📥</span>
                            <span>Download Note File</span>
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}

          {activeTab === "attendance" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FFD700] bg-opacity-20 rounded-lg flex items-center justify-center">
                  <FaCalendarCheck className="text-[#FFD700] text-xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">My Attendance Records</h2>
              </div>
              <button
                onClick={fetchAttendance}
                className="px-4 py-2 bg-black text-[#FFD700] font-semibold rounded-xl hover:bg-gray-900 transition-all flex items-center gap-2"
              >
                <FaCalendarCheck className="text-sm" /> Refresh
              </button>
            </div>
            {attendance.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <FaCalendarCheck className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-semibold">No attendance records found.</p>
                <p className="text-gray-400 text-sm mt-2">Your attendance will appear here once your educators mark it.</p>
              </div>
            )}
            {attendance.length > 0 && (
              <>
                {/* Attendance Statistics */}
                {(() => {
                  const totalRecords = attendance.length;
                  const presentCount = attendance.filter(a => a.status === "present").length;
                  const absentCount = attendance.filter(a => a.status === "absent").length;
                  const lateCount = attendance.filter(a => a.status === "late").length;
                  const attendancePercentage = totalRecords > 0 
                    ? Math.round(((presentCount + lateCount) / totalRecords) * 100) 
                    : 0;

                  return (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                      <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <p className="text-sm text-gray-600 mb-1">Total Records</p>
                        <p className="text-2xl font-bold text-gray-800">{totalRecords}</p>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
                        <p className="text-sm text-green-700 mb-1">Present</p>
                        <p className="text-2xl font-bold text-green-800">{presentCount}</p>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
                        <p className="text-sm text-red-700 mb-1">Absent</p>
                        <p className="text-2xl font-bold text-red-800">{absentCount}</p>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm">
                        <p className="text-sm text-yellow-700 mb-1">Late</p>
                        <p className="text-2xl font-bold text-yellow-800">{lateCount}</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                        <p className="text-sm text-blue-700 mb-1">Attendance %</p>
                        <p className="text-2xl font-bold text-blue-800">{attendancePercentage}%</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Attendance Table */}
                <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Day
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Course
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {attendance.map((a) => {
                          const attendanceDate = new Date(a.date);
                          const dayOfWeek = attendanceDate.toLocaleDateString("en-US", { weekday: "long" });
                          const formattedDate = attendanceDate.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          });

                          const getStatusBadge = (status) => {
                            switch (status?.toLowerCase()) {
                              case "present":
                                return (
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">
                                    ✓ Present
                                  </span>
                                );
                              case "absent":
                                return (
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                                    ✗ Absent
                                  </span>
                                );
                              case "late":
                                return (
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">
                                    ⏰ Late
                                  </span>
                                );
                              default:
                                return (
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-300">
                                    ? Unknown
                                  </span>
                                );
                            }
                          };

                          return (
                            <tr key={a._id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formattedDate}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {dayOfWeek}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {a.courseId?.title || (typeof a.courseId === 'string' ? "Loading..." : "Unknown Course")}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {getStatusBadge(a.status)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
          )}

          {activeTab === "liveclasses" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Upcoming Live Classes</h2>
              <button
                onClick={fetchLiveClasses}
                className="px-4 py-2 bg-black text-[#FFD700] font-semibold rounded-xl hover:bg-gray-900 transition-all flex items-center gap-2"
              >
                <FaVideo className="text-sm" /> Refresh
              </button>
            </div>
            {loadingLiveClasses && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700] mx-auto mb-4"></div>
                <p className="text-gray-500">Loading live classes...</p>
              </div>
            )}
            {!loadingLiveClasses && liveClasses.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <FaVideo className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-semibold">No live classes scheduled.</p>
                <p className="text-gray-400 text-sm mt-2">You'll see upcoming live classes from your enrolled courses here.</p>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              {liveClasses.map((liveClass) => {
                const scheduledDate = new Date(liveClass.scheduledDate);
                const isUpcoming = scheduledDate > new Date();
                const isLive = liveClass.status === "live";
                const isCompleted = liveClass.status === "completed";
                const canJoin = isUpcoming || isLive;

                const handleJoin = async () => {
                  try {
                    // For portal-based classes, join and open video player
                    if (liveClass.platformType === "portal") {
                      const response = await axios.post(
                        `${serverUrl}/api/liveclass/${liveClass._id}/join`,
                        {},
                        { withCredentials: true }
                      );
                      
                      if (response.data.alreadyJoined) {
                        toast.info("You have already joined this live class");
                      } else {
                        toast.success("Successfully joined the live class");
                      }
                      
                      // Open video player
                      setCurrentLiveClassId(liveClass._id);
                      setCurrentPlatformType("portal");
                      setShowVideoPlayer(true);
                      fetchLiveClasses();
                    } else {
                      // For external platforms (Zoom/Google Meet), just open the link
                      // The link will be opened via the anchor tag, but we can still track join
                      try {
                        await axios.post(
                          `${serverUrl}/api/liveclass/${liveClass._id}/join`,
                          {},
                          { withCredentials: true }
                        );
                      } catch (err) {
                        // Silent error - still allow opening the link
                      }
                    }
                  } catch (error) {
                    toast.error(error.response?.data?.message || "Failed to join live class");
                  }
                };

                return (
                  <div
                    key={liveClass._id}
                    className={`border rounded-xl p-5 shadow-lg transition-all ${
                      isLive
                        ? "bg-red-50 border-red-300 border-l-4 border-l-red-500"
                        : isCompleted
                        ? "bg-gray-50 border-gray-200"
                        : "bg-white border-gray-200 hover:shadow-xl"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold text-gray-800">{liveClass.title}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          isLive
                            ? "bg-red-100 text-red-800"
                            : isCompleted
                            ? "bg-gray-100 text-gray-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {liveClass.status.toUpperCase()}
                      </span>
                    </div>

                    {liveClass.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {liveClass.description}
                      </p>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">Course:</span>
                        <span>{liveClass.courseId?.title || "Unknown Course"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">Educator:</span>
                        <span>{liveClass.educatorId?.name || "Unknown"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>📅</span>
                        <span>{scheduledDate.toLocaleString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>⏱️</span>
                        <span>{liveClass.duration} minutes</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>👥</span>
                        <span>
                          {liveClass.enrolledStudents?.length || 0} / {liveClass.maxParticipants}{" "}
                          students
                        </span>
                      </div>
                    </div>

                    {/* Platform indicator */}
                    <div className="mb-3 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                      <span className="font-semibold">Platform:</span>{" "}
                      {liveClass.platformType === "portal" && (
                        <span className="text-blue-700">Our Portal (Built-in Video)</span>
                      )}
                      {liveClass.platformType === "zoom" && (
                        <span className="text-blue-700">Zoom</span>
                      )}
                      {liveClass.platformType === "google-meet" && (
                        <span className="text-green-700">Google Meet</span>
                      )}
                    </div>

                    {/* Meeting details for external platforms */}
                    {(liveClass.platformType === "zoom" || liveClass.platformType === "google-meet") && liveClass.meetingId && (
                      <div className="mb-3 p-2 bg-gray-100 rounded text-sm">
                        <p className="text-gray-700">
                          <span className="font-medium">Meeting ID:</span> {liveClass.meetingId}
                        </p>
                        {liveClass.meetingPassword && (
                          <p className="text-gray-700 mt-1">
                            <span className="font-medium">Password:</span> {liveClass.meetingPassword}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {canJoin && (
                        <>
                          {liveClass.platformType === "portal" ? (
                            <button
                              onClick={handleJoin}
                              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-semibold"
                            >
                              <span>🎥</span>
                              <span>{isLive ? "Join Now" : "Join Live Class"}</span>
                            </button>
                          ) : liveClass.meetingLink ? (
                            <a
                              href={liveClass.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={handleJoin}
                              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-semibold"
                            >
                              <span>🎥</span>
                              <span>{isLive ? "Join Now" : `Join ${liveClass.platformType === "zoom" ? "Zoom" : "Google Meet"}`}</span>
                            </a>
                          ) : (
                            <button
                              disabled
                              className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
                            >
                              <span>🎥</span>
                              <span>Meeting link not available</span>
                            </button>
                          )}
                        </>
                      )}
                      {isCompleted && liveClass.recordingUrl && (
                        <a
                          href={liveClass.recordingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-semibold"
                        >
                          <span>📹</span>
                          <span>Watch Recording</span>
                        </a>
                      )}
                    </div>

                    {isCompleted && !liveClass.recordingUrl && (
                      <p className="text-sm text-gray-500 mt-2 text-center">
                        Recording will be available soon
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {activeTab === "grades" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">My Grades & Marks</h2>
              <button
                onClick={fetchGrades}
                className="px-4 py-2 bg-black text-[#FFD700] font-semibold rounded-xl hover:bg-gray-900 transition-all flex items-center gap-2"
              >
                <FaGraduationCap className="text-sm" /> Refresh
              </button>
            </div>
            {loadingGrades && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700] mx-auto mb-4"></div>
                <p className="text-gray-500">Loading grades...</p>
              </div>
            )}
            {!loadingGrades && grades.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <FaGraduationCap className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-semibold">No grades available yet.</p>
                <p className="text-gray-400 text-sm mt-2">
                  Your grades will appear here once your educators upload them.
                </p>
              </div>
            )}
            {!loadingGrades && grades.length > 0 && (
              <div className="space-y-4">
                {/* Group by course */}
                {Object.entries(
                  grades.reduce((acc, grade) => {
                    const courseId = grade.courseId?._id || grade.courseId;
                    const courseTitle = grade.courseId?.title || "Unknown Course";
                    if (!acc[courseId]) {
                      acc[courseId] = { title: courseTitle, grades: [] };
                    }
                    acc[courseId].grades.push(grade);
                    return acc;
                  }, {})
                ).map(([courseId, { title, grades: courseGrades }]) => {
                  const averagePercentage =
                    courseGrades.reduce((sum, g) => sum + g.percentage, 0) /
                    courseGrades.length;

                  const getGradeColor = (grade) => {
                    switch (grade) {
                      case "A+":
                      case "A":
                        return "bg-green-100 text-green-800";
                      case "B+":
                      case "B":
                        return "bg-blue-100 text-blue-800";
                      case "C+":
                      case "C":
                        return "bg-yellow-100 text-yellow-800";
                      case "D":
                        return "bg-orange-100 text-orange-800";
                      case "F":
                        return "bg-red-100 text-red-800";
                      default:
                        return "bg-gray-100 text-gray-800";
                    }
                  };

                  return (
                    <div key={courseId} className="bg-white border rounded-lg shadow-sm p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Average</p>
                          <p className="text-2xl font-bold">{Math.round(averagePercentage)}%</p>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                Subject
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                Assignment
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                Type
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                Marks
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                Percentage
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                Grade
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                Date
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {courseGrades.map((grade) => (
                              <tr key={grade._id} className="hover:bg-gray-50">
                                <td className="px-3 py-2 text-sm font-medium">{grade.subject}</td>
                                <td className="px-3 py-2 text-sm">
                                  {grade.assignmentName || "-"}
                                </td>
                                <td className="px-3 py-2 text-sm capitalize">{grade.examType}</td>
                                <td className="px-3 py-2 text-sm">
                                  {grade.marksObtained} / {grade.totalMarks}
                                </td>
                                <td className="px-3 py-2 text-sm font-semibold">
                                  {grade.percentage}%
                                </td>
                                <td className="px-3 py-2">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-bold ${getGradeColor(
                                      grade.grade
                                    )}`}
                                  >
                                    {grade.grade}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-sm">
                                  {new Date(grade.date).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {courseGrades.some((g) => g.remarks) && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-sm font-semibold mb-2">Remarks:</h4>
                          {courseGrades
                            .filter((g) => g.remarks)
                            .map((grade) => (
                              <div key={grade._id} className="text-sm text-gray-700 mb-1">
                                <span className="font-medium">{grade.subject}:</span>{" "}
                                {grade.remarks}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      {/* Live Video Player */}
      {showVideoPlayer && currentLiveClassId && (
        currentPlatformType === "portal" ? (
          <LiveKitPlayer
            liveClassId={currentLiveClassId}
            userRole={userData?.role}
            isEducator={false}
            onClose={() => {
              setShowVideoPlayer(false);
              setCurrentLiveClassId(null);
            }}
          />
        ) : (
          <LiveVideoPlayer
            liveClassId={currentLiveClassId}
            userRole={userData?.role}
            isEducator={false}
            onClose={() => {
              setShowVideoPlayer(false);
              setCurrentLiveClassId(null);
            }}
          />
        )
      )}
    </div>
  );
}

export default StudentDashboard;

