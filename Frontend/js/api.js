const BACKEND_BASE_URL = "https://complaints-registration-platform-full-hwdi.onrender.com/api";

export const apiCall = async (endpoint, options = {}) => {
  const url = `${BACKEND_BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: { "Content-Type": "application/json" },
    credentials: "include", // Important for sending/receiving cookies
  };

  const finalOptions = { ...defaultOptions, ...options };

  if (options.body) {
    finalOptions.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, finalOptions);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong");
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const showToast = (message, type = "success") => {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};
