import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { serverUrl } from "../../App";
import { FaUsers, FaCommentDots, FaCog } from "react-icons/fa";

function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ role: "", status: "" });
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    status: "approved",
  });
  const [passwordUpdates, setPasswordUpdates] = useState({});
  const [editingPassword, setEditingPassword] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/admin/users`, {
        params: { ...filters },
        withCredentials: true,
      });
      setUsers(res.data || []);
    } catch (error) {
      console.error("Fetch users error:", error);
      const errorMessage = error?.response?.data?.message || "Failed to load users";
      toast.error(errorMessage);
      
      // If unauthorized or forbidden, redirect to login
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.role, filters.status]);

  const createUser = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error("Name, email, password required");
      return;
    }
    try {
      await axios.post(`${serverUrl}/api/admin/users`, form, { withCredentials: true });
      toast.success("User created");
      setForm({ name: "", email: "", password: "", role: "student", status: "approved" });
      fetchUsers();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Create failed");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(
        `${serverUrl}/api/admin/users/${id}/status`,
        { status },
        { withCredentials: true }
      );
      toast.success("Status updated");
      fetchUsers();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Update failed");
    }
  };

  const updatePassword = async (userId) => {
    const newPassword = passwordUpdates[userId];
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    try {
      await axios.patch(
        `${serverUrl}/api/admin/users/${userId}/password`,
        { password: newPassword },
        { withCredentials: true }
      );
      toast.success("Password updated successfully");
      setPasswordUpdates((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
      setEditingPassword(null);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update password");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-8 pt-20 sm:pt-24">
      <div className="max-w-6xl mx-auto">
        {/* Header with Feedback Link */}
        <div className="bg-gradient-to-r from-black via-gray-900 to-black rounded-2xl shadow-2xl p-4 sm:p-6 mb-4 sm:mb-6 border-2 border-[#FFD700] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#FFD700] mb-2 flex items-center gap-2 sm:gap-3">
              <FaUsers className="text-xl sm:text-2xl" /> <span>User Management</span>
            </h1>
            <p className="text-white text-sm sm:text-base">Manage all users, educators, and students</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate("/admin/portal")}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-[#FFD700] text-black font-bold rounded-xl active:bg-[#FFC107] transition-all shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base min-h-[44px]"
            >
              <FaCog /> <span className="hidden sm:inline">Portal</span> <span className="sm:hidden">Portal</span>
            </button>
            <button
              onClick={() => navigate("/admin/feedback")}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-[#FFD700] text-black font-bold rounded-xl active:bg-[#FFC107] transition-all shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base min-h-[44px]"
            >
              <FaCommentDots /> <span className="hidden sm:inline">Feedback</span> <span className="sm:hidden">Feedback</span>
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg sm:text-xl font-bold">Users List</h2>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <select
                className="border-2 border-gray-300 rounded-lg p-3 text-sm sm:text-base text-black w-full sm:w-auto min-h-[44px] focus:outline-none focus:border-[#FFD700]"
                value={filters.role}
                onChange={(e) => setFilters((p) => ({ ...p, role: e.target.value }))}
              >
                <option value="">All roles</option>
                <option value="student">Student</option>
                <option value="educator">Educator</option>
                <option value="admin">Admin</option>
              </select>
              <select
                className="border-2 border-gray-300 rounded-lg p-3 text-sm sm:text-base text-black w-full sm:w-auto min-h-[44px] focus:outline-none focus:border-[#FFD700]"
                value={filters.status}
                onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="">All status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-3 sm:space-y-4">
            <h2 className="font-semibold text-lg sm:text-xl">Create User</h2>
            <input
              className="w-full border-2 border-gray-300 rounded-lg p-3 text-black text-base focus:outline-none focus:border-[#FFD700] min-h-[44px]"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
            <input
              className="w-full border-2 border-gray-300 rounded-lg p-3 text-black text-base focus:outline-none focus:border-[#FFD700] min-h-[44px]"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            />
            <input
              className="w-full border-2 border-gray-300 rounded-lg p-3 text-black text-base focus:outline-none focus:border-[#FFD700] min-h-[44px]"
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            />
            <select
              className="w-full border-2 border-gray-300 rounded-lg p-3 text-black text-base focus:outline-none focus:border-[#FFD700] min-h-[44px]"
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            >
              <option value="student">Student</option>
              <option value="educator">Educator</option>
              <option value="admin">Admin</option>
            </select>
            <select
              className="w-full border-2 border-gray-300 rounded-lg p-3 text-black text-base focus:outline-none focus:border-[#FFD700] min-h-[44px]"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
            >
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            <button 
              onClick={createUser} 
              className="w-full px-4 py-3 bg-black text-white rounded-lg font-semibold active:bg-gray-800 transition-all min-h-[44px]"
            >
              Create User
            </button>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h2 className="font-semibold text-lg sm:text-xl">Users ({users.length})</h2>
            <div className="max-h-[520px] overflow-y-auto space-y-2 sm:space-y-3">
              {users.map((u) => (
                <div key={u._id} className="border-2 border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div className="flex-1 w-full">
                      <p className="font-semibold text-base sm:text-lg">{u.name}</p>
                      <p className="text-sm sm:text-base text-gray-600 break-words">{u.email}</p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Role: <span className="font-semibold">{u.role}</span> • Status: <span className="font-semibold">{u.status}</span>
                      </p>
                      
                      {/* Password Update Section */}
                      {editingPassword === u._id ? (
                        <div className="mt-3 space-y-2">
                          <input
                            type="password"
                            className="w-full border-2 border-gray-300 rounded-lg p-3 text-base text-black focus:outline-none focus:border-[#FFD700] min-h-[44px]"
                            placeholder="New password (min 8 chars)"
                            value={passwordUpdates[u._id] || ""}
                            onChange={(e) =>
                              setPasswordUpdates((prev) => ({
                                ...prev,
                                [u._id]: e.target.value,
                              }))
                            }
                          />
                          <div className="flex gap-2">
                            <button
                              className="flex-1 px-4 py-2 bg-green-600 text-white text-sm sm:text-base rounded-lg active:bg-green-700 transition-all min-h-[44px] font-semibold"
                              onClick={() => updatePassword(u._id)}
                            >
                              Save
                            </button>
                            <button
                              className="flex-1 px-4 py-2 bg-gray-300 text-black text-sm sm:text-base rounded-lg active:bg-gray-400 transition-all min-h-[44px] font-semibold"
                              onClick={() => {
                                setEditingPassword(null);
                                setPasswordUpdates((prev) => {
                                  const updated = { ...prev };
                                  delete updated[u._id];
                                  return updated;
                                });
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="mt-2 text-sm sm:text-base text-blue-600 hover:underline active:text-blue-800 min-h-[44px] px-2 py-1"
                          onClick={() => setEditingPassword(u._id)}
                        >
                          🔑 Update Password
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                      <button
                        className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white text-sm sm:text-base rounded-lg active:bg-green-700 transition-all min-h-[44px] font-semibold"
                        onClick={() => updateStatus(u._id, "approved")}
                      >
                        Approve
                      </button>
                      <button
                        className="flex-1 sm:flex-none px-4 py-2 bg-orange-600 text-white text-sm sm:text-base rounded-lg active:bg-orange-700 transition-all min-h-[44px] font-semibold"
                        onClick={() => updateStatus(u._id, "pending")}
                      >
                        Pending
                      </button>
                      <button
                        className="flex-1 sm:flex-none px-4 py-2 bg-red-600 text-white text-sm sm:text-base rounded-lg active:bg-red-700 transition-all min-h-[44px] font-semibold"
                        onClick={() => updateStatus(u._id, "rejected")}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {users.length === 0 && <p className="text-gray-500 text-sm">No users.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminUsers;

