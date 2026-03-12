const getBaseOrigin = () => {
  const host = window.location.hostname;

  if (host === "admin.intellectualprogress.uz") {
    return "https://admin.intellectualprogress.uz/api";
  }
  if (host === "teacher.intellectualprogress.uz") {
    return "https://teacher.intellectualprogress.uz/api";
  }
  if (host === "register.intellectualprogress.uz") {
    return "https://register.intellectualprogress.uz/api";
  }
  if (host === "director.intellectualprogress.uz") {
    return "https://director.intellectualprogress.uz/api";
  }
  if (host === "cpanel.intellectualprogress.uz") {
    return "https://cpanel.intellectualprogress.uz/api";
  }
  if (host === "193.181.208.209") {
    return "http://193.181.208.209:8080/api";
  }
  if (host === "localhost") {
    return "http://localhost:3000";
  }

  return "";
};

export const BASE_ORIGIN = getBaseOrigin();
export const API_URL = `${BASE_ORIGIN}`;
export const SOCKET_URL = BASE_ORIGIN;

export const directorEndpoints = {
  getDashboardStats: `${API_URL}/director-panel/dashboard/stats`,
  getRevenueChart: `${API_URL}/director-panel/dashboard/revenue`,
  getBranchPerformance: `${API_URL}/director-panel/dashboard/branches`,
  getRecentActivities: `${API_URL}/director-panel/dashboard/activities`,

  getBranches: `${API_URL}/director-panel/branches`,
  getBranchDetails: (id) => `${API_URL}/director-panel/branches/${id}`,
  createBranch: `${API_URL}/director-panel/branches`,
  updateBranch: (id) => `${API_URL}/director-panel/branches/${id}`,
  deleteBranch: (id) => `${API_URL}/director-panel/branches/${id}`,

  getGroups: `${API_URL}/director-panel/groups`,
  getGroupDetails: (id) => `${API_URL}/director-panel/groups/${id}`,
  createGroup: `${API_URL}/director-panel/groups`,
  updateGroup: (id) => `${API_URL}/director-panel/groups/${id}`,

  getDebts: `${API_URL}/director-panel/debts`,
  getDebtDetails: (id) => `${API_URL}/director-panel/debts/${id}`,
  sendReminder: (id) => `${API_URL}/director-panel/debts/${id}/remind`,
  markAsPaid: (id) => `${API_URL}/director-panel/debts/${id}/paid`,

  getTeachers: `${API_URL}/director-panel/teachers`,
  getTeacherDetails: (id) => `${API_URL}/director-panel/teachers/${id}`,
  getTeacherPerformance: (id) => `${API_URL}/director-panel/teachers/${id}/performance`,

  getRooms: `${API_URL}/director-panel/rooms`,
  getRoomSchedule: (id) => `${API_URL}/director-panel/rooms/${id}/schedule`,
  updateRoomStatus: (id) => `${API_URL}/director-panel/rooms/${id}/status`,

  updateProfile: `${API_URL}/director-panel/settings/profile`,
  changePassword: `${API_URL}/director-panel/settings/password`,
  updateNotifications: `${API_URL}/director-panel/settings/notifications`,

  login: `${API_URL}/director-panel/auth/login`,
  logout: `${API_URL}/director-panel/auth/logout`,
  checkAuth: `${API_URL}/director-panel/auth/check`,
  refreshToken: `${API_URL}/director-panel/auth/refresh`,
};

export default API_URL;