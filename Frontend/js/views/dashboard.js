import { apiCall, showToast } from "../api.js";
import { navigateTo } from "../router.js";

let submissionState = { complaint_text: "", ai_question: "" };

export const renderMyComplaints = async (container) => {
  container.innerHTML = `
    <div class="card card-wide">
      <div class="dashboard-header">
        <h2>My Complaints</h2>
        <button style="width: auto;" onclick="window.routerNavigateTo('/submit')">Submit New Complaint</button>
      </div>
      <div id="complaints-list">Loading...</div>
    </div>
  `;

  try {
    const complaints = await apiCall("/complaints/my");
    const listEl = document.getElementById("complaints-list");
    
    if (complaints.length === 0) {
      listEl.innerHTML = `<p style="color: var(--text-secondary)">You haven't submitted any complaints yet.</p>`;
      return;
    }

    listEl.innerHTML = complaints.map(c => `
      <div class="complaint-item">
        <div class="complaint-header">
          <span>Complaint ID: #${c.id}</span>
          <span>${new Date(c.created_at).toLocaleDateString()}</span>
        </div>
        <div style="white-space: pre-wrap;">${c.complaint_text}</div>
        ${c.ai_question ? `
          <div class="complaint-qa">
            <div class="ai-q">AI Follow-up: ${c.ai_question}</div>
            <div class="user-a">Your Answer: ${c.user_answer || "<em>No answer provided</em>"}</div>
          </div>
        ` : ""}
      </div>
    `).join("");
  } catch (error) {
    document.getElementById("complaints-list").innerHTML = `<div class="error-msg visible">Failed to load complaints</div>`;
  }
};

export const renderSubmitComplaint = (container) => {
  container.innerHTML = `
    <div class="card card-wide">
      <h2>Submit a Complaint</h2>
      <button class="secondary mb-4" style="width: auto" onclick="window.routerNavigateTo('/dashboard')">&larr; Back</button>
      
      <div id="step-1-complaint">
        <form id="form-submit-complaint">
          <div class="form-group">
            <label>Describe your issue in detail</label>
            <textarea id="complaint-text" required></textarea>
          </div>
          <div class="error-msg" id="submit-error-1"></div>
          <button type="submit" id="btn-get-q">Next Step</button>
        </form>
      </div>

      <div id="step-2-ai" style="display: none;">
        <div class="complaint-item mb-4" style="background: rgba(79, 70, 229, 0.1); border-color: var(--primary)">
          <div class="ai-q" id="display-ai-q"></div>
        </div>
        <form id="form-submit-final">
          <div class="form-group">
            <label>Your Answer</label>
            <textarea id="user-answer" required></textarea>
          </div>
          <div class="error-msg" id="submit-error-2"></div>
          <button type="submit" id="btn-final">Submit Complaint</button>
        </form>
      </div>
    </div>
  `;
};

export const renderAdminDashboard = async (container) => {
  container.innerHTML = `
    <div class="card card-wide">
      <div class="dashboard-header">
        <h2>Admin Dashboard</h2>
      </div>
      <div id="admin-complaints-list">Loading...</div>
    </div>
  `;

  try {
    const complaints = await apiCall("/admin/complaints");
    const listEl = document.getElementById("admin-complaints-list");
    
    if (complaints.length === 0) {
      listEl.innerHTML = `<p style="color: var(--text-secondary)">No complaints found in the system.</p>`;
      return;
    }

    listEl.innerHTML = complaints.map(c => `
      <div class="complaint-item">
        <div class="complaint-header">
          <span>From: ${c.user.name} (${c.user.email})</span>
          <span>${new Date(c.created_at).toLocaleDateString()}</span>
        </div>
        <div style="white-space: pre-wrap;">${c.complaint_text}</div>
        ${c.ai_question ? `
          <div class="complaint-qa">
            <div class="ai-q">AI Follow-up: ${c.ai_question}</div>
            <div class="user-a">User Answer: ${c.user_answer || "<em>No answer provided</em>"}</div>
          </div>
        ` : ""}
      </div>
    `).join("");
  } catch (error) {
    document.getElementById("admin-complaints-list").innerHTML = `<div class="error-msg visible">Failed to load complaints or you are not an admin.</div>`;
  }
};

export const handleDashboardAction = async (e) => {
  if (e.target.id === "form-submit-complaint") {
    submissionState.complaint_text = document.getElementById("complaint-text").value;
    const btn = document.getElementById("btn-get-q");
    const errorEl = document.getElementById("submit-error-1");
    errorEl.classList.remove("visible");

    try {
      btn.disabled = true;
      btn.textContent = "Analyzing...";
      const res = await apiCall("/ai/question", {
        method: "POST",
        body: { complaint_text: submissionState.complaint_text }
      });
      
      submissionState.ai_question = res.ai_question;
      document.getElementById("display-ai-q").textContent = res.ai_question;
      
      document.getElementById("step-1-complaint").style.display = "none";
      document.getElementById("step-2-ai").style.display = "block";
    } catch (error) {
      errorEl.textContent = error.message;
      errorEl.classList.add("visible");
      btn.disabled = false;
      btn.textContent = "Next Step";
    }
  }

  if (e.target.id === "form-submit-final") {
    const user_answer = document.getElementById("user-answer").value;
    const btn = document.getElementById("btn-final");
    const errorEl = document.getElementById("submit-error-2");
    errorEl.classList.remove("visible");

    try {
      btn.disabled = true;
      btn.textContent = "Submitting...";
      await apiCall("/complaints", {
        method: "POST",
        body: { 
          complaint_text: submissionState.complaint_text,
          ai_question: submissionState.ai_question,
          user_answer
        }
      });
      
      showToast("Complaint submitted successfully");
      navigateTo("/dashboard");
    } catch (error) {
      errorEl.textContent = error.message;
      errorEl.classList.add("visible");
      btn.disabled = false;
      btn.textContent = "Submit Complaint";
    }
  }
};
