import { renderLogin, renderRegister, handleAuthAction } from "./views/auth.js";
import { renderMyComplaints, renderSubmitComplaint, renderAdminDashboard, handleDashboardAction } from "./views/dashboard.js";
import { apiCall } from "./api.js";

let currentUser = null;

export const navigateTo = (path) => {
  window.history.pushState({}, path, window.location.origin + path);
  router();
};

export const router = async () => {
  const path = window.location.pathname;
  const appContent = document.getElementById("app-content");
  
  try {
    // Check session
    currentUser = await apiCall("/auth/me");
    updateNavbar(true);
  } catch (error) {
    currentUser = null;
    updateNavbar(false);
  }

  // Define allowed routes for unauthenticated users
  if (!currentUser) {
    if (path === "/register") {
      renderRegister(appContent);
    } else {
      // Default to login if not logged in
      renderLogin(appContent);
      if (path !== "/login" && path !== "/") {
          window.history.replaceState({}, "/login", "/login");
      }
    }
    return;
  }

  // Authenticated routes
  if (currentUser.role === "admin") {
    renderAdminDashboard(appContent);
    if (path !== "/admin") {
        window.history.replaceState({}, "/admin", "/admin");
    }
  } else {
    if (path === "/submit") {
      renderSubmitComplaint(appContent);
    } else {
      renderMyComplaints(appContent);
      if (path !== "/dashboard") {
          window.history.replaceState({}, "/dashboard", "/dashboard");
      }
    }
  }
};

const updateNavbar = (isLoggedIn) => {
  const navLinks = document.getElementById("nav-links");
  if (isLoggedIn) {
    navLinks.innerHTML = `
      <span style="color: var(--text-secondary); margin-right: 1rem;">Hi, ${currentUser.name}</span>
      <a id="nav-logout">Logout</a>
    `;
    document.getElementById("nav-logout").addEventListener("click", async () => {
      await apiCall("/auth/logout", { method: "POST" });
      navigateTo("/login");
    });
  } else {
    navLinks.innerHTML = `
      <a onclick="window.routerNavigateTo('/login')">Login</a>
      <a onclick="window.routerNavigateTo('/register')">Register</a>
    `;
  }
};

// Global handlers for links
window.routerNavigateTo = navigateTo;

window.addEventListener("popstate", router);

// Attach global event listener for form actions
document.addEventListener("submit", (e) => {
    e.preventDefault();
    if(e.target.closest("#app-content")) {
        if(e.target.id.startsWith("auth-")) {
            handleAuthAction(e);
        } else {
            handleDashboardAction(e);
        }
    }
});

// Attach click handlers
document.addEventListener("click", (e) => {
    if(e.target.closest("#app-content")) {
        handleDashboardAction(e);
    }
});
