const express = require("express");
const router = express.Router();
const db = require("../database/db");

// -----------------------------
// Generate Ticket ID
// -----------------------------
function generateTicketId(id) {
  return `TKT-${String(id).padStart(3, "0")}`;
}

// -----------------------------
// CREATE TICKET
// -----------------------------
router.post("/", (req, res) => {
  try {
    const { customer_name, customer_email, subject, description } = req.body;

    const insert = db.prepare(`
      INSERT INTO tickets (customer_name, customer_email, subject, description)
      VALUES (?, ?, ?, ?)
    `);

    const result = insert.run(
      customer_name,
      customer_email,
      subject,
      description
    );

    const ticketId = generateTicketId(result.lastInsertRowid);

    db.prepare(`
      UPDATE tickets SET ticket_id=? WHERE id=?
    `).run(ticketId, result.lastInsertRowid);

    res.status(201).json({
      ticket_id: ticketId,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// GET ALL TICKETS
// -----------------------------
router.get("/", (req, res) => {
  try {
    const { status, search } = req.query;

    let query = `SELECT * FROM tickets WHERE 1=1`;
    let params = [];

    if (status) {
      query += ` AND status=?`;
      params.push(status);
    }

    if (search) {
      query += `
        AND (
          ticket_id LIKE ?
          OR customer_name LIKE ?
          OR customer_email LIKE ?
          OR description LIKE ?
        )
      `;

      const value = `%${search}%`;
      params.push(value, value, value, value);
    }

    query += ` ORDER BY created_at DESC`;

    const stmt = db.prepare(query);
    const tickets = stmt.all(...params);

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// GET SINGLE TICKET
// -----------------------------
router.get("/:ticketId", (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = db
      .prepare(`SELECT * FROM tickets WHERE ticket_id=?`)
      .get(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const notes = db
      .prepare(`SELECT * FROM notes WHERE ticket_id=? ORDER BY created_at DESC`)
      .all(ticketId);

    res.json({
      ...ticket,
      notes
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// UPDATE TICKET
// -----------------------------
router.put("/:ticketId", (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status, note } = req.body;

    db.prepare(`
      UPDATE tickets
      SET status=?, updated_at=CURRENT_TIMESTAMP
      WHERE ticket_id=?
    `).run(status, ticketId);

    if (note) {
      db.prepare(`
        INSERT INTO notes (ticket_id, note_text)
        VALUES (?, ?)
      `).run(ticketId, note);
    }

    res.json({
      success: true,
      updated_at: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;