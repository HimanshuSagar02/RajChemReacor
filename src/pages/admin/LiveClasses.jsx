import React, { useEffect, useState } from "react";
import axios from "axios";
import { serverUrl } from "../../App";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { FaVideo, FaCalendarAlt, FaClock, FaUsers, FaEdit, FaTrash, FaPlay, FaStop } from "react-icons/fa";
import LiveVideoPlayer from "../../components/LiveVideoPlayer";
import LiveKitPlayer from "../../components/LiveKitPlayer";

function LiveClasses() {
  const { userData } = useSelector((state) => state.user);
  const { courseData } = useSelector((state) => state.course);

  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [currentLiveClassId, setCurrentLiveClassId] = useState(null);
  const [currentPlatformType, setCurrentPlatformType] = useState("portal");
  const [showAllStudents, setShowAllStudents] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    courseId: "",
    platformType: "portal", // portal, zoom, google-meet
    meetingLink: "",
    meetingId: "",
    meetingPassword: "",
    scheduleType: "scheduled", // "scheduled" or "startnow"
    scheduledDate: "",
    duration: 60,
    maxParticipants: 100,
  });

  const fetchLiveClasses = async () => {
    setLoading(true);
    try {
      console.log("[LiveClasses] Fetching live classes for educator...");
      const res = await axios.get(`${serverUrl}/api/liveclass/educator`, {
        withCredentials: true,
      });
      console.log("[LiveClasses] Live classes fetched:", res.data?.length || 0);
      setLiveClasses(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("[LiveClasses] Error fetching live classes:", error);
      const errorMessage = error.response?.data?.message || "Failed to fetch live classes";
      toast.error(errorMessage);
      setLiveClasses([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveClasses();
  }, []);

  const fetchAllStudents = async () => {
    setLoadingStudents(true);
    try {
      const res = await axios.get(`${serverUrl}/api/user/allstudents`, {
        withCredentials: true,
      });
      setAllStudents(res.data || []);
    } catch (error) {
      toast.error("Failed to fetch all students");
      console.error("Error fetching all students:", error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare data for submission
      const submitData = { ...formData };
      
      // If "Start Now" is selected, set scheduledDate to current time
      if (submitData.scheduleType === "startnow") {
        submitData.scheduledDate = new Date().toISOString();
      }
      
      // Remove scheduleType from submission (not needed in backend)
      delete submitData.scheduleType;
      
      if (editingClass) {
        await axios.patch(
          `${serverUrl}/api/liveclass/${editingClass._id}`,
          submitData,
          { withCredentials: true }
        );
        toast.success("Live class updated successfully");
        
        // If "Start Now" was selected, automatically start the class
        if (formData.scheduleType === "startnow") {
          await handleStatusChange(editingClass._id, "live");
          if (formData.platformType === "portal") {
            setCurrentLiveClassId(editingClass._id);
            setCurrentPlatformType("portal");
            setShowVideoPlayer(true);
          } else if (submitData.meetingLink) {
            window.open(submitData.meetingLink, '_blank');
          }
        }
      } else {
        console.log("[LiveClasses] Creating new live class...", submitData);
        const response = await axios.post(`${serverUrl}/api/liveclass`, submitData, {
          withCredentials: true,
        });
        console.log("[LiveClasses] Live class created:", response.data);
        toast.success("Live class created successfully");
        
        // If "Start Now" was selected, automatically start the class
        if (formData.scheduleType === "startnow") {
          const newLiveClassId = response.data._id;
          await handleStatusChange(newLiveClassId, "live");
          if (formData.platformType === "portal") {
            setCurrentLiveClassId(newLiveClassId);
            setCurrentPlatformType("portal");
            setShowVideoPlayer(true);
          } else if (submitData.meetingLink) {
            window.open(submitData.meetingLink, '_blank');
          }
        }
      }
      setShowModal(false);
      setEditingClass(null);
      resetForm();
      fetchLiveClasses();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save live class");
    }
  };

  const handleEdit = (liveClass) => {
    setEditingClass(liveClass);
    const scheduledDate = new Date(liveClass.scheduledDate);
    const isPastOrNow = scheduledDate <= new Date();
    
    setFormData({
      title: liveClass.title,
      description: liveClass.description || "",
      courseId: liveClass.courseId._id || liveClass.courseId,
      platformType: liveClass.platformType || "portal",
      meetingLink: liveClass.meetingLink || "",
      meetingId: liveClass.meetingId || "",
      meetingPassword: liveClass.meetingPassword || "",
      scheduleType: isPastOrNow ? "startnow" : "scheduled",
      scheduledDate: scheduledDate.toISOString().slice(0, 16),
      duration: liveClass.duration || 60,
      maxParticipants: liveClass.maxParticipants || 100,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this live class?")) return;
    try {
      await axios.delete(`${serverUrl}/api/liveclass/${id}`, {
        withCredentials: true,
      });
      toast.success("Live class deleted successfully");
      fetchLiveClasses();
    } catch (error) {
      toast.error("Failed to delete live class");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.patch(
        `${serverUrl}/api/liveclass/${id}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      toast.success(`Live class status updated to ${newStatus}`);
      fetchLiveClasses();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      courseId: "",
      platformType: "portal",
      meetingLink: "",
      meetingId: "",
      meetingPassword: "",
      scheduleType: "scheduled",
      scheduledDate: "",
      duration: 60,
      maxParticipants: 100,
    });
  };

  const { creatorCourseData } = useSelector((state) => state.course);
  
  // Use creatorCourseData if available, otherwise filter courseData
  const myCourses = (() => {
    if (creatorCourseData && creatorCourseData.length > 0) {
      return creatorCourseData;
    }
    return courseData?.filter(
      (c) => c.creator?._id === userData?._id || c.creator === userData?._id
    ) || [];
  })();

  const getStatusColor = (status) => {
    switch (status) {
      case "live":
        return "bg-red-100 text-red-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <FaVideo className="text-blue-600" />
            Live Classes
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowAllStudents(!showAllStudents);
                if (!showAllStudents && allStudents.length === 0) {
                  fetchAllStudents();
                }
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <FaUsers /> {showAllStudents ? "Hide" : "Show"} All Students
            </button>
            <button
              onClick={() => {
                resetForm();
                setEditingClass(null);
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <FaVideo /> Create Live Class
            </button>
          </div>
        </div>

        {/* All Students List */}
        {showAllStudents && (
          <div className="mb-6 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaUsers className="text-green-600" />
              All Enrolled Students in App ({allStudents.length})
            </h2>
            {loadingStudents ? (
              <div className="text-center py-8">Loading students...</div>
            ) : allStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No students found</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                {allStudents.map((student) => (
                  <div
                    key={student._id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      {student.photoUrl ? (
                        <img
                          src={student.photoUrl}
                          alt={student.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                          {(student.name || "S").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{student.name}</p>
                        <p className="text-sm text-gray-600 truncate">{student.email}</p>
                        {student.class && (
                          <p className="text-xs text-gray-500">Class: {student.class}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : liveClasses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FaVideo className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No live classes created yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveClasses.map((liveClass) => (
              <div
                key={liveClass._id}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {liveClass.title}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      liveClass.status
                    )}`}
                  >
                    {liveClass.status.toUpperCase()}
                  </span>
                </div>

                {liveClass.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {liveClass.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaCalendarAlt />
                    <span>
                      Scheduled: {formatDate(liveClass.scheduledDate)}
                      {new Date(liveClass.scheduledDate) > new Date() && (
                        <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                          Future
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaClock />
                    <span>{liveClass.duration} minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaUsers />
                    <span>
                      {liveClass.enrolledStudents?.length || 0} / {liveClass.maxParticipants}{" "}
                      students
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">Course:</span>
                    <span>
                      {liveClass.courseId?.title || "Unknown Course"}
                    </span>
                  </div>
                  <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
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
                  {(liveClass.platformType === "zoom" || liveClass.platformType === "google-meet") && liveClass.meetingLink && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                      <a
                        href={liveClass.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:underline"
                      >
                        🔗 Meeting Link
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  {liveClass.status === "scheduled" && (
                    <>
                      {liveClass.platformType === "portal" ? (
                        <>
                          <button
                            onClick={async () => {
                              try {
                                // Start the class immediately
                                await handleStatusChange(liveClass._id, "live");
                                setCurrentLiveClassId(liveClass._id);
                                setCurrentPlatformType("portal");
                                setShowVideoPlayer(true);
                                toast.success("Live class started! Students can now join.");
                              } catch (error) {
                                toast.error("Failed to start live class");
                              }
                            }}
                            className="flex-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 flex items-center justify-center gap-2 text-sm font-semibold"
                          >
                            <FaPlay /> Start Now
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={async () => {
                              try {
                                // Start the class immediately
                                await handleStatusChange(liveClass._id, "live");
                                toast.success("Live class started! Opening meeting link...");
                                // Open meeting link in new tab
                                window.open(liveClass.meetingLink, '_blank');
                              } catch (error) {
                                toast.error("Failed to start live class");
                              }
                            }}
                            className="flex-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 flex items-center justify-center gap-2 text-sm font-semibold"
                          >
                            <FaPlay /> Start Now
                          </button>
                        </>
                      )}
                    </>
                  )}
                  {liveClass.status === "live" && (
                    <>
                      {liveClass.platformType === "portal" ? (
                        <>
                          <button
                            onClick={() => {
                              setCurrentLiveClassId(liveClass._id);
                              setCurrentPlatformType("portal");
                              setShowVideoPlayer(true);
                            }}
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2 text-sm"
                          >
                            <FaVideo /> Join
                          </button>
                          <button
                            onClick={() => handleStatusChange(liveClass._id, "completed")}
                            className="flex-1 bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 flex items-center justify-center gap-2 text-sm"
                          >
                            <FaStop /> End
                          </button>
                        </>
                      ) : (
                        <>
                          <a
                            href={liveClass.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2 text-sm"
                          >
                            <FaVideo /> Join Meeting
                          </a>
                          <button
                            onClick={() => handleStatusChange(liveClass._id, "completed")}
                            className="flex-1 bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 flex items-center justify-center gap-2 text-sm"
                          >
                            <FaStop /> End
                          </button>
                        </>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => handleEdit(liveClass)}
                    className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(liveClass._id)}
                    className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
                  >
                    <FaTrash />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">
                {editingClass ? "Edit Live Class" : "Create Live Class"}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Choose your preferred platform for the live class session.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Platform Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Platform Type *</label>
                  <div className="grid grid-cols-3 gap-3">
                    <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.platformType === "portal" 
                        ? "border-blue-600 bg-blue-50" 
                        : "border-gray-300 hover:border-gray-400"
                    }`}>
                      <input
                        type="radio"
                        name="platformType"
                        value="portal"
                        checked={formData.platformType === "portal"}
                        onChange={(e) => setFormData({ ...formData, platformType: e.target.value })}
                        className="mb-2"
                      />
                      <FaVideo className="text-2xl mb-2" />
                      <span className="text-sm font-semibold">Our Portal</span>
                      <span className="text-xs text-gray-600 text-center mt-1">Built-in video platform</span>
                    </label>
                    <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.platformType === "zoom" 
                        ? "border-blue-600 bg-blue-50" 
                        : "border-gray-300 hover:border-gray-400"
                    }`}>
                      <input
                        type="radio"
                        name="platformType"
                        value="zoom"
                        checked={formData.platformType === "zoom"}
                        onChange={(e) => setFormData({ ...formData, platformType: e.target.value })}
                        className="mb-2"
                      />
                      <span className="text-2xl mb-2">📹</span>
                      <span className="text-sm font-semibold">Zoom</span>
                      <span className="text-xs text-gray-600 text-center mt-1">External Zoom link</span>
                    </label>
                    <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.platformType === "google-meet" 
                        ? "border-blue-600 bg-blue-50" 
                        : "border-gray-300 hover:border-gray-400"
                    }`}>
                      <input
                        type="radio"
                        name="platformType"
                        value="google-meet"
                        checked={formData.platformType === "google-meet"}
                        onChange={(e) => setFormData({ ...formData, platformType: e.target.value })}
                        className="mb-2"
                      />
                      <span className="text-2xl mb-2">🎥</span>
                      <span className="text-sm font-semibold">Google Meet</span>
                      <span className="text-xs text-gray-600 text-center mt-1">External Meet link</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Course *</label>
                  <select
                    required
                    value={formData.courseId}
                    onChange={(e) =>
                      setFormData({ ...formData, courseId: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select a course</option>
                    {myCourses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Platform-specific fields */}
                {(formData.platformType === "zoom" || formData.platformType === "google-meet") && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Meeting Link * 
                        <span className="text-xs text-gray-500 ml-1">
                          ({formData.platformType === "zoom" ? "Zoom" : "Google Meet"} URL)
                        </span>
                      </label>
                      <input
                        type="url"
                        required
                        value={formData.meetingLink}
                        onChange={(e) =>
                          setFormData({ ...formData, meetingLink: e.target.value })
                        }
                        placeholder={formData.platformType === "zoom" 
                          ? "https://zoom.us/j/..." 
                          : "https://meet.google.com/..."}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Meeting ID</label>
                        <input
                          type="text"
                          value={formData.meetingId}
                          onChange={(e) =>
                            setFormData({ ...formData, meetingId: e.target.value })
                          }
                          placeholder="Optional"
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input
                          type="text"
                          value={formData.meetingPassword}
                          onChange={(e) =>
                            setFormData({ ...formData, meetingPassword: e.target.value })
                          }
                          placeholder="Optional"
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                    </div>
                  </>
                )}

                {formData.platformType === "portal" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">ℹ️</span> Using our built-in video platform. 
                      No external links needed. Students will join through the integrated video player.
                    </p>
                  </div>
                )}

                {/* Schedule Type Selection */}
                <div>
                  <label className="block text-sm font-medium mb-1">Schedule Type *</label>
                  <select
                    required
                    value={formData.scheduleType || "scheduled"}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduleType: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="scheduled">Schedule for Later (Date & Time)</option>
                    <option value="startnow">Start Now (Immediately)</option>
                  </select>
                </div>

                {/* Scheduled Date & Time - Only show if "scheduled" is selected */}
                {formData.scheduleType === "scheduled" && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Scheduled Date & Time *</label>
                    <input
                      type="datetime-local"
                      required={formData.scheduleType === "scheduled"}
                      value={formData.scheduledDate}
                      onChange={(e) =>
                        setFormData({ ...formData, scheduledDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Select a future date and time for the live class
                    </p>
                  </div>
                )}

                {/* Start Now Info - Only show if "startnow" is selected */}
                {formData.scheduleType === "startnow" && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-semibold flex items-center gap-2">
                      <FaPlay className="text-green-600" />
                      Start Now Selected
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      The live class will start immediately after creation. You'll be able to join right away.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min="15"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: parseInt(e.target.value) })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Max Participants
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxParticipants}
                      onChange={(e) =>
                        setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Max Participants
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxParticipants}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxParticipants: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    {editingClass ? "Update" : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingClass(null);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Live Video Player */}
      {showVideoPlayer && currentLiveClassId && (
        currentPlatformType === "portal" ? (
          <LiveKitPlayer
            liveClassId={currentLiveClassId}
            userRole={userData?.role}
            isEducator={true}
            onClose={() => {
              setShowVideoPlayer(false);
              setCurrentLiveClassId(null);
            }}
          />
        ) : (
          <LiveVideoPlayer
            liveClassId={currentLiveClassId}
            userRole={userData?.role}
            isEducator={true}
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

export default LiveClasses;

