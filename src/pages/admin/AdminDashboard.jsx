import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../../App";
import { toast } from "react-toastify";
import { 
  FaUsers, 
  FaBook, 
  FaClipboardList, 
  FaCalendarCheck, 
  FaBell, 
  FaVideo,
  FaExclamationTriangle,
  FaChartLine,
  FaCog,
  FaDatabase,
  FaServer,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaFilter,
  FaUserShield,
  FaGraduationCap,
  FaMoneyBillWave,
  FaFileAlt,
  FaArrowUp,
  FaArrowDown,
  FaDownload,
  FaSearch,
  FaChartBar,
  FaPercentage,
  FaUserCheck,
  FaUserTimes,
  FaSync,
  FaEye,
  FaEyeSlash
} from "react-icons/fa";
import {
  FaArrowTrendUp,
  FaArrowTrendDown
} from "react-icons/fa6";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area } from "recharts";

function AdminDashboard() {
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [portalStats, setPortalStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [problems, setProblems] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds default
  const [errors, setErrors] = useState({ stats: null, activities: null, problems: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSection, setFilterSection] = useState("all");
  const [showCharts, setShowCharts] = useState(true);
  const [chartType, setChartType] = useState("line"); // line, bar, area

  // Redirect if not admin
  useEffect(() => {
    if (userData && userData.role !== "admin") {
      if (userData.role === "educator") {
        navigate("/dashboard");
      } else {
        navigate("/student-dashboard");
      }
    }
  }, [userData, navigate]);

  // Verify admin status on mount
  useEffect(() => {
    if (userData) {
      console.log("[AdminDashboard] User data:", userData);
      console.log("[AdminDashboard] User role:", userData.role);
      if (userData.role !== "admin") {
        console.warn("[AdminDashboard] User is not an admin!");
      }
    }
  }, [userData]);

  // Fetch portal statistics
  const fetchPortalStats = async () => {
    try {
      console.log("[AdminDashboard] Fetching portal stats from:", `${serverUrl}/api/admin/portal/stats`);
      const res = await axios.get(`${serverUrl}/api/admin/portal/stats`, {
        withCredentials: true
      });
      setPortalStats(res.data);
      setErrors(prev => ({ ...prev, stats: null }));
      console.log("[AdminDashboard] Portal stats fetched:", res.data);
    } catch (error) {
      const errorDetails = {
        message: error.response?.data?.message || error.message || "Failed to load portal statistics",
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      };
      setErrors(prev => ({ ...prev, stats: errorDetails }));
      console.error("[AdminDashboard] Fetch portal stats error:", error);
      console.error("[AdminDashboard] Error response:", error.response?.data);
      console.error("[AdminDashboard] Error status:", error.response?.status);
      if (!portalStats) { // Only show error on initial load
        toast.error(errorDetails.message);
      }
    }
  };

  // Fetch activities
  const fetchActivities = async () => {
    try {
      console.log("[AdminDashboard] Fetching activities from:", `${serverUrl}/api/admin/portal/activities`);
      const res = await axios.get(`${serverUrl}/api/admin/portal/activities`, {
        withCredentials: true,
        params: { days: 7 }
      });
      setActivities(res.data || []);
      setErrors(prev => ({ ...prev, activities: null }));
      console.log("[AdminDashboard] Activities fetched:", res.data?.length || 0);
    } catch (error) {
      const errorDetails = {
        message: error.response?.data?.message || error.message || "Failed to load activities",
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      };
      setErrors(prev => ({ ...prev, activities: errorDetails }));
      console.error("[AdminDashboard] Fetch activities error:", error);
      console.error("[AdminDashboard] Error response:", error.response?.data);
      console.error("[AdminDashboard] Error status:", error.response?.status);
      if (activities.length === 0) { // Only show error on initial load
        toast.error(errorDetails.message);
      }
    }
  };

  // Fetch problems
  const fetchProblems = async () => {
    try {
      console.log("[AdminDashboard] Fetching problems from:", `${serverUrl}/api/admin/portal/problems`);
      const res = await axios.get(`${serverUrl}/api/admin/portal/problems`, {
        withCredentials: true
      });
      setProblems(res.data || []);
      setErrors(prev => ({ ...prev, problems: null }));
      console.log("[AdminDashboard] Problems fetched:", res.data?.length || 0);
    } catch (error) {
      const errorDetails = {
        message: error.response?.data?.message || error.message || "Failed to load problems",
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      };
      setErrors(prev => ({ ...prev, problems: errorDetails }));
      console.error("[AdminDashboard] Fetch problems error:", error);
      console.error("[AdminDashboard] Error response:", error.response?.data);
      console.error("[AdminDashboard] Error status:", error.response?.status);
      if (problems.length === 0) { // Only show error on initial load
        toast.error(errorDetails.message);
      }
    }
  };

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPortalStats(),
        fetchActivities(),
        fetchProblems()
      ]);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("[AdminDashboard] Fetch all data error:", error);
      // If all requests fail, show a helpful message
      if (!portalStats && !activities.length && !problems.length) {
        toast.error("Unable to connect to server. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (userData?.role === "admin") {
      fetchAllData();
    }
  }, [userData]);

  // Real-time polling effect
  useEffect(() => {
    if (!userData || userData.role !== "admin" || !autoRefresh) {
      return;
    }

    const interval = setInterval(() => {
      console.log("[AdminDashboard] Auto-refreshing data...");
      fetchAllData();
    }, refreshInterval);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, autoRefresh, refreshInterval]);

  if (!userData || userData.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading...</p>
      </div>
    );
  }

  const stats = portalStats || {};
  const COLORS = ['#FFD700', '#FFA500', '#FF6347', '#32CD32', '#1E90FF', '#9370DB', '#FF1493', '#00CED1'];

  // Filter activities based on search and section
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = !searchTerm || 
      activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.section?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSection = filterSection === "all" || activity.section === filterSection;
    return matchesSearch && matchesSection;
  });

  // Calculate additional statistics
  const enrollmentRate = stats.totalUsers > 0 
    ? ((stats.totalEnrollments / stats.totalUsers) * 100).toFixed(1) 
    : 0;
  const courseCompletionRate = stats.totalEnrollments > 0 
    ? ((stats.activeEnrollments / stats.totalEnrollments) * 100).toFixed(1) 
    : 0;
  const publishRate = stats.totalCourses > 0 
    ? ((stats.publishedCourses / stats.totalCourses) * 100).toFixed(1) 
    : 0;

  // Prepare chart data
  const userGrowthData = stats.userGrowth || [];
  const sectionActivityData = stats.sectionActivity || [];
  
  // Calculate trend indicators
  const recentUsers = userGrowthData.slice(-3).reduce((sum, d) => sum + (d.users || 0), 0);
  const previousUsers = userGrowthData.slice(-6, -3).reduce((sum, d) => sum + (d.users || 0), 0);
  const userTrend = previousUsers > 0 ? ((recentUsers - previousUsers) / previousUsers * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-black via-gray-900 to-black rounded-2xl shadow-2xl p-6 mb-6 border-2 border-[#FFD700]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#FFD700] mb-2 flex items-center gap-3">
                <FaUserShield className="text-4xl" />
                Admin Dashboard
              </h1>
              <p className="text-white text-sm md:text-base">Complete portal management and monitoring</p>
              {lastRefresh && (
                <p className="text-gray-400 text-xs mt-1 flex items-center gap-2">
                  <FaClock className="text-xs" />
                  Last updated: {lastRefresh.toLocaleTimeString()}
                  {autoRefresh && (
                    <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                      Auto-refresh: {refreshInterval / 1000}s
                    </span>
                  )}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={fetchAllData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh data"
              >
                <FaCog className={`${loading ? 'animate-spin' : ''}`} /> 
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`px-4 py-2 font-semibold rounded-lg transition-all flex items-center gap-2 ${
                    autoRefresh 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                  title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
                >
                  <FaCheckCircle /> {autoRefresh ? 'Auto ON' : 'Auto OFF'}
                </button>
                {autoRefresh && (
                  <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    className="px-2 py-2 bg-gray-700 text-white rounded-lg text-sm border border-gray-600 focus:outline-none focus:border-[#FFD700]"
                    title="Refresh interval"
                  >
                    <option value={10000}>10s</option>
                    <option value={30000}>30s</option>
                    <option value={60000}>1m</option>
                    <option value={120000}>2m</option>
                    <option value={300000}>5m</option>
                  </select>
                )}
              </div>
              <button
                onClick={() => navigate("/admin/users")}
                className="px-4 py-2 bg-[#FFD700] text-black font-semibold rounded-lg hover:bg-[#FFC107] transition-all flex items-center gap-2"
              >
                <FaUsers /> Manage Users
              </button>
              <button
                onClick={() => navigate("/admin/portal")}
                className="px-4 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-all flex items-center gap-2"
              >
                <FaCog /> Portal Details
              </button>
            </div>
          </div>
        </div>

        {/* Error Diagnostics - Show if there are errors */}
        {(errors.stats || errors.activities || errors.problems) && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6">
            <h3 className="text-lg font-bold text-red-800 mb-2 flex items-center gap-2">
              <FaExclamationTriangle className="text-red-600" />
              API Connection Issues
            </h3>
            <div className="space-y-2 text-sm">
              {errors.stats && (
                <div className="bg-red-100 p-2 rounded">
                  <strong>Portal Stats:</strong> {errors.stats.message} 
                  {errors.stats.status && <span className="ml-2 text-red-600">(Status: {errors.stats.status})</span>}
                </div>
              )}
              {errors.activities && (
                <div className="bg-red-100 p-2 rounded">
                  <strong>Activities:</strong> {errors.activities.message}
                  {errors.activities.status && <span className="ml-2 text-red-600">(Status: {errors.activities.status})</span>}
                </div>
              )}
              {errors.problems && (
                <div className="bg-red-100 p-2 rounded">
                  <strong>Problems:</strong> {errors.problems.message}
                  {errors.problems.status && <span className="ml-2 text-red-600">(Status: {errors.problems.status})</span>}
                </div>
              )}
              <div className="mt-3 text-xs text-gray-600">
                <p>Server URL: {serverUrl}</p>
                <p>User Role: {userData?.role || "Unknown"}</p>
                <p>Check browser console (F12) for detailed error logs.</p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6 border-2 border-blue-300 hover:shadow-xl transition-all transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium mb-1 flex items-center gap-2">
                  <FaUsers className="text-blue-500" />
                  Total Users
                </p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers || 0}</p>
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="text-green-600 font-semibold">Students: {stats.students || 0}</span>
                  <span className="text-blue-600 font-semibold">Educators: {stats.educators || 0}</span>
                </div>
                {stats.recentUsers > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-xs">
                    <FaTrendingUp className="text-green-500" />
                    <span className="text-green-600 font-semibold">+{stats.recentUsers} this month</span>
                  </div>
                )}
              </div>
              <FaUsers className="text-5xl text-blue-500 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-6 border-2 border-green-300 hover:shadow-xl transition-all transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium mb-1 flex items-center gap-2">
                  <FaBook className="text-green-500" />
                  Total Courses
                </p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCourses || 0}</p>
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="text-green-600 font-semibold">Published: {stats.publishedCourses || 0}</span>
                  <span className="text-gray-600 font-semibold">Draft: {stats.draftCourses || 0}</span>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs">
                  <FaPercentage className="text-green-500" />
                  <span className="text-green-600 font-semibold">{publishRate}% published</span>
                </div>
              </div>
              <FaBook className="text-5xl text-green-500 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg p-6 border-2 border-purple-300 hover:shadow-xl transition-all transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium mb-1 flex items-center gap-2">
                  <FaGraduationCap className="text-purple-500" />
                  Total Enrollments
                </p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalEnrollments || 0}</p>
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="text-purple-600 font-semibold">Active: {stats.activeEnrollments || 0}</span>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs">
                  <FaPercentage className="text-purple-500" />
                  <span className="text-purple-600 font-semibold">{enrollmentRate}% enrollment rate</span>
                </div>
              </div>
              <FaGraduationCap className="text-5xl text-purple-500 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg p-6 border-2 border-red-300 hover:shadow-xl transition-all transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium mb-1 flex items-center gap-2">
                  <FaExclamationTriangle className="text-red-500" />
                  Pending Issues
                </p>
                <p className="text-3xl font-bold text-gray-900">{problems.length || 0}</p>
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="text-red-600 font-semibold">Critical: {problems.filter(p => p.severity === "critical").length}</span>
                  <span className="text-orange-600 font-semibold">High: {problems.filter(p => p.severity === "high").length}</span>
                </div>
                {stats.pendingUsers > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-xs">
                    <FaUserTimes className="text-orange-500" />
                    <span className="text-orange-600 font-semibold">{stats.pendingUsers} pending approvals</span>
                  </div>
                )}
              </div>
              <FaExclamationTriangle className="text-5xl text-red-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Additional Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs font-medium">Enrollment Rate</p>
                <p className="text-2xl font-bold text-gray-900">{enrollmentRate}%</p>
              </div>
              <FaPercentage className="text-3xl text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs font-medium">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{courseCompletionRate}%</p>
              </div>
              <FaCheckCircle className="text-3xl text-indigo-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-teal-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs font-medium">Today's Activity</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayActivity || 0}</p>
              </div>
              <FaChartLine className="text-3xl text-teal-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-pink-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs font-medium">Database Status</p>
                <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  {stats.dbConnected ? (
                    <>
                      <FaCheckCircle className="text-green-500" />
                      <span className="text-green-600">Connected</span>
                    </>
                  ) : (
                    <>
                      <FaTimesCircle className="text-red-500" />
                      <span className="text-red-600">Disconnected</span>
                    </>
                  )}
                </p>
              </div>
              <FaDatabase className="text-3xl text-pink-500" />
            </div>
          </div>
        </div>

        {/* Data Visualization Charts */}
        {showCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* User Growth Chart */}
            {userGrowthData.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FaChartLine className="text-[#FFD700]" />
                    User Growth (Last 7 Days)
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setChartType("line")}
                      className={`px-3 py-1 rounded text-sm ${chartType === "line" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
                    >
                      Line
                    </button>
                    <button
                      onClick={() => setChartType("bar")}
                      className={`px-3 py-1 rounded text-sm ${chartType === "bar" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
                    >
                      Bar
                    </button>
                    <button
                      onClick={() => setChartType("area")}
                      className={`px-3 py-1 rounded text-sm ${chartType === "area" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
                    >
                      Area
                    </button>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  {chartType === "line" ? (
                    <LineChart data={userGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="users" stroke="#1E90FF" strokeWidth={2} name="New Users" />
                    </LineChart>
                  ) : chartType === "bar" ? (
                    <BarChart data={userGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="users" fill="#1E90FF" name="New Users" />
                    </BarChart>
                  ) : (
                    <AreaChart data={userGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="users" stroke="#1E90FF" fill="#1E90FF" fillOpacity={0.6} name="New Users" />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
                {userTrend !== 0 && (
                  <div className="mt-2 text-sm flex items-center gap-2">
                    {parseFloat(userTrend) > 0 ? (
                      <>
                        <FaTrendingUp className="text-green-500" />
                        <span className="text-green-600 font-semibold">+{Math.abs(userTrend)}% growth trend</span>
                      </>
                    ) : (
                      <>
                        <FaTrendingDown className="text-red-500" />
                        <span className="text-red-600 font-semibold">{userTrend}% decline</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Section Activity Pie Chart */}
            {sectionActivityData.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FaChartBar className="text-[#FFD700]" />
                  Section Activity Distribution
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sectionActivityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sectionActivityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Chart Toggle */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setShowCharts(!showCharts)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all flex items-center gap-2"
          >
            {showCharts ? <FaEyeSlash /> : <FaEye />}
            {showCharts ? "Hide Charts" : "Show Charts"}
          </button>
        </div>

        {/* Quick Access Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaCog className="text-[#FFD700]" />
            Quick Access
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <button
              onClick={() => navigate("/admin/users")}
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all flex flex-col items-center gap-2 border-2 border-blue-200"
            >
              <FaUsers className="text-2xl text-blue-600" />
              <span className="text-sm font-semibold text-gray-800">Users</span>
            </button>
            <button
              onClick={() => navigate("/admin/feedback")}
              className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-all flex flex-col items-center gap-2 border-2 border-green-200"
            >
              <FaBell className="text-2xl text-green-600" />
              <span className="text-sm font-semibold text-gray-800">Feedback</span>
            </button>
            <button
              onClick={() => navigate("/liveclasses")}
              className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all flex flex-col items-center gap-2 border-2 border-purple-200"
            >
              <FaVideo className="text-2xl text-purple-600" />
              <span className="text-sm font-semibold text-gray-800">Live Classes</span>
            </button>
            <button
              onClick={() => navigate("/attendance")}
              className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-all flex flex-col items-center gap-2 border-2 border-orange-200"
            >
              <FaCalendarCheck className="text-2xl text-orange-600" />
              <span className="text-sm font-semibold text-gray-800">Attendance</span>
            </button>
            <button
              onClick={() => navigate("/grades")}
              className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-all flex flex-col items-center gap-2 border-2 border-yellow-200"
            >
              <FaClipboardList className="text-2xl text-yellow-600" />
              <span className="text-sm font-semibold text-gray-800">Grades</span>
            </button>
            <button
              onClick={() => navigate("/admin/portal")}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all flex flex-col items-center gap-2 border-2 border-gray-200"
            >
              <FaDatabase className="text-2xl text-gray-600" />
              <span className="text-sm font-semibold text-gray-800">Portal Details</span>
            </button>
          </div>
        </div>

        {/* Recent Activities with Search and Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FaClock className="text-[#FFD700]" />
              Recent Activities ({filteredActivities.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {/* Search */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#FFD700]"
                />
              </div>
              {/* Filter by Section */}
              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#FFD700]"
              >
                <option value="all">All Sections</option>
                <option value="authentication">Authentication</option>
                <option value="courses">Courses</option>
                <option value="assignments">Assignments</option>
                <option value="live-classes">Live Classes</option>
                <option value="attendance">Attendance</option>
                <option value="notifications">Notifications</option>
              </select>
              {/* Export Button */}
              <button
                onClick={() => {
                  const dataStr = JSON.stringify(filteredActivities, null, 2);
                  const dataBlob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `activities_${new Date().toISOString().split('T')[0]}.json`;
                  link.click();
                  toast.success("Activities exported successfully!");
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
              >
                <FaDownload /> Export
              </button>
            </div>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <FaSync className="animate-spin text-4xl text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Loading activities...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaSearch className="text-4xl mx-auto mb-2 opacity-50" />
              <p>No activities found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredActivities.slice(0, 20).map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:bg-gray-100 transition-all border border-gray-200">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    activity.section === "authentication" ? "bg-blue-100" :
                    activity.section === "courses" ? "bg-green-100" :
                    activity.section === "assignments" ? "bg-purple-100" :
                    activity.section === "live-classes" ? "bg-red-100" :
                    "bg-gray-100"
                  }`}>
                    {activity.section === "authentication" && <FaUsers className="text-blue-600 text-xl" />}
                    {activity.section === "courses" && <FaBook className="text-green-600 text-xl" />}
                    {activity.section === "assignments" && <FaClipboardList className="text-purple-600 text-xl" />}
                    {activity.section === "live-classes" && <FaVideo className="text-red-600 text-xl" />}
                    {!["authentication", "courses", "assignments", "live-classes"].includes(activity.section) && <FaCog className="text-gray-600 text-xl" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{activity.description || activity.action || "Activity"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-1 bg-gray-200 rounded text-gray-700">{activity.section}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{activity.user || "System"}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  {activity.type && (
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      activity.type === "success" ? "bg-green-100 text-green-800" :
                      activity.type === "info" ? "bg-blue-100 text-blue-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {activity.type}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Problems/Issues */}
        {problems.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-red-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FaExclamationTriangle className="text-red-600" />
              Detected Problems ({problems.length})
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {problems.slice(0, 5).map((problem, index) => (
                <div key={index} className={`p-4 rounded-lg border-2 ${
                  problem.severity === "critical" ? "bg-red-50 border-red-300" :
                  problem.severity === "high" ? "bg-orange-50 border-orange-300" :
                  problem.severity === "medium" ? "bg-yellow-50 border-yellow-300" :
                  "bg-blue-50 border-blue-300"
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{problem.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{problem.description}</p>
                      <p className="text-xs text-gray-500 mt-2">Section: {problem.section} • Status: {problem.status}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      problem.severity === "critical" ? "bg-red-200 text-red-800" :
                      problem.severity === "high" ? "bg-orange-200 text-orange-800" :
                      problem.severity === "medium" ? "bg-yellow-200 text-yellow-800" :
                      "bg-blue-200 text-blue-800"
                    }`}>
                      {problem.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {problems.length > 5 && (
              <button
                onClick={() => navigate("/admin/portal")}
                className="mt-4 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-gray-700 transition-all"
              >
                View All Problems
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
