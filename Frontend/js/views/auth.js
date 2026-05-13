import { apiCall, showToast } from "../api.js";
import { navigateTo } from "../router.js";

let registrationState = { email: "", name: "" };

export const renderLogin = (container) => {
  container.innerHTML = `
    <div class="card">
      <h2>Welcome Back</h2>
      <form id="auth-login">
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="login-email" required>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="login-password" required>
        </div>
        <div class="error-msg" id="login-error"></div>
        <button type="submit" class="mt-3">Log In</button>
      </form>
      <div class="text-center mt-3">
        <span style="color: var(--text-secondary); font-size: 0.875rem;">
          Don't have an account? <a class="link" onclick="window.routerNavigateTo('/register')">Sign up</a>
        </span>
      </div>
    </div>
  `;
};

export const renderRegister = (container) => {
  container.innerHTML = `
    <div class="card" id="register-step-1">
      <h2>Create Account</h2>
      <form id="auth-register-otp">
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" id="reg-name" required>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="reg-email" required>
        </div>
        <div class="error-msg" id="reg-error-1"></div>
        <button type="submit" class="mt-3" id="btn-send-otp">Send OTP</button>
      </form>
      <div class="text-center mt-3">
        <span style="color: var(--text-secondary); font-size: 0.875rem;">
          Already have an account? <a class="link" onclick="window.routerNavigateTo('/login')">Log in</a>
        </span>
      </div>
    </div>

    <div class="card" id="register-step-2" style="display: none;">
      <h2>Verify OTP & Setup Password</h2>
      <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 1.5rem;">
        An OTP has been sent to your email.
      </p>
      <form id="auth-register-final">
        <div class="form-group">
          <label>OTP</label>
          <input type="text" id="reg-otp" required>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="reg-pass" required>
        </div>
        <div class="form-group">
          <label>Confirm Password</label>
          <input type="password" id="reg-pass-confirm" required>
        </div>
        <div class="error-msg" id="reg-error-2"></div>
        <button type="submit" class="mt-3">Complete Registration</button>
      </form>
    </div>
  `;
};

export const handleAuthAction = async (e) => {
  if (e.target.id === "auth-login") {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const errorEl = document.getElementById("login-error");
    errorEl.classList.remove("visible");

    try {
      await apiCall("/auth/login", {
        method: "POST",
        body: { email, password }
      });
      showToast("Logged in successfully");
      navigateTo("/dashboard");
    } catch (error) {
      errorEl.textContent = error.message;
      errorEl.classList.add("visible");
    }
  }

  if (e.target.id === "auth-register-otp") {
    const btn = document.getElementById("btn-send-otp");
    registrationState.name = document.getElementById("reg-name").value;
    registrationState.email = document.getElementById("reg-email").value;
    const errorEl = document.getElementById("reg-error-1");
    errorEl.classList.remove("visible");

    try {
      btn.disabled = true;
      btn.textContent = "Sending...";
      await apiCall("/auth/send-otp", {
        method: "POST",
        body: { name: registrationState.name, email: registrationState.email }
      });
      showToast("OTP sent to your email");
      document.getElementById("register-step-1").style.display = "none";
      document.getElementById("register-step-2").style.display = "block";
    } catch (error) {
      errorEl.textContent = error.message;
      errorEl.classList.add("visible");
      btn.disabled = false;
      btn.textContent = "Send OTP";
    }
  }

  if (e.target.id === "auth-register-final") {
    const otp = document.getElementById("reg-otp").value;
    const password = document.getElementById("reg-pass").value;
    const confirm = document.getElementById("reg-pass-confirm").value;
    const errorEl = document.getElementById("reg-error-2");
    errorEl.classList.remove("visible");

    if (password !== confirm) {
      errorEl.textContent = "Passwords do not match";
      errorEl.classList.add("visible");
      return;
    }

    try {
      await apiCall("/auth/register", {
        method: "POST",
        body: { email: registrationState.email, otp, password }
      });
      showToast("Registration complete. Please log in.");
      navigateTo("/login");
    } catch (error) {
      errorEl.textContent = error.message;
      errorEl.classList.add("visible");
    }
  }
};
