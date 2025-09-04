const getApiBaseUrl = () => {
    const host = window.location.hostname;
  
    if (host === "admin.intellectualprogress.uz") {
      return "https://admin.intellectualprogress.uz";
    }
    if (host === "teacher.intellectualprogress.uz") {
      return "https://teacher.intellectualprogress.uz";
    }
    // fallback IP orqali test uchun
    if (host === "193.181.208.209") {
      return "http://193.181.208.209:8080";
    }
    if (host === "localhost") {
      return "http://localhost:3000";
    }
    // default
    return "";
  };
  
  const API_URL = getApiBaseUrl();
  console.log(API_URL);

  export default API_URL
  