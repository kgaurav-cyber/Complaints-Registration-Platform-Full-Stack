const express = require("express");
const { db } = require("../db");
const { complaints, users } = require("../db/schema");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { generateFollowUpQuestion } = require("../utils/ai");
const { eq, desc } = require("drizzle-orm");

const router = express.Router();

router.post("/question", authenticate, async (req, res) => {
  const { complaint_text } = req.body;
  if (!complaint_text) return res.status(400).json({ error: "Complaint text is required" });

  const ai_question = await generateFollowUpQuestion(complaint_text);
  res.json({ ai_question });
});

router.post("/", authenticate, async (req, res) => {
  const { complaint_text, ai_question, user_answer } = req.body;
  if (!complaint_text) return res.status(400).json({ error: "Complaint text is required" });

  try {
    const newComplaint = await db.insert(complaints).values({
      user_id: req.user.id,
      complaint_text,
      ai_question,
      user_answer,
    }).returning();
    res.json(newComplaint[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to submit complaint" });
  }
});

router.get("/my", authenticate, async (req, res) => {
  try {
    const userComplaints = await db.select()
      .from(complaints)
      .where(eq(complaints.user_id, req.user.id))
      .orderBy(desc(complaints.created_at));
    res.json(userComplaints);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
});

// For /api/admin/complaints - mounted in app.js
const adminRouter = express.Router();

adminRouter.get("/complaints", authenticate, requireAdmin, async (req, res) => {
  try {
    const allComplaints = await db.select({
      id: complaints.id,
      complaint_text: complaints.complaint_text,
      ai_question: complaints.ai_question,
      user_answer: complaints.user_answer,
      created_at: complaints.created_at,
      user: {
        name: users.name,
        email: users.email,
      }
    })
    .from(complaints)
    .innerJoin(users, eq(complaints.user_id, users.id))
    .orderBy(desc(complaints.created_at));
    
    res.json(allComplaints);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch all complaints" });
  }
});

module.exports = { complaintRouter: router, adminRouter };
