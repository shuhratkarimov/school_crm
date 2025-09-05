const getApiBaseUrl = () => {
  const host = window.location.hostname;

  if (host === "admin.intellectualprogress.uz") {
    return "https://admin.intellectualprogress.uz/api";
  }
  if (host === "teacher.intellectualprogress.uz") {
    return "https://teacher.intellectualprogress.uz/api";
  }
  if (host === "193.181.208.209") {
    return "http://193.181.208.209:8080/api";
  }
  if (host === "localhost") {
    return "http://localhost:3000";
  }
  return "";
};
  
const API_URL = getApiBaseUrl();

export default API_URL
  