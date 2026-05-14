import { renderLogin, renderRegister, handleAuthAction } from "./views/auth.js";
import { renderMyComplaints, renderSubmitComplaint, renderAdminDashboard, handleDashboardAction } from "./views/dashboard.js";
import { apiCall } from "./api.js";

let currentUser = null;

export const navigateTo = (path) => {
  window.location.hash = path;
};

export const router = async () => {
  const path = window.location.hash.slice(1) || "/";
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
    } else if (path !== "/login" && path !== "/") {
      window.location.hash = "/login";
      return;
    } else {
      renderLogin(appContent);
    }
    return;
  }

  // Authenticated routes
  if (currentUser.role === "admin") {
    if (path !== "/admin") {
        window.location.hash = "/admin";
        return;
    }
    renderAdminDashboard(appContent);
  } else {
    if (path === "/submit") {
      renderSubmitComplaint(appContent);
    } else if (path !== "/dashboard") {
        window.location.hash = "/dashboard";
        return;
    } else {
      renderMyComplaints(appContent);
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

window.addEventListener("hashchange", router);

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
