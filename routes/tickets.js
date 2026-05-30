const express = require("express");
const router = express.Router();
const db = require("../database/db");

function generateTicketId(id) {
  return `TKT-${String(id).padStart(3, "0")}`;
}
router.post("/", (req, res) => {
  const {
    customer_name,
    customer_email,
    subject,
    description
  } = req.body;

  const sql = `
    INSERT INTO tickets
    (
      customer_name,
      customer_email,
      subject,
      description
    )
    VALUES (?, ?, ?, ?)
  `;

  db.run(
    sql,
    [
      customer_name,
      customer_email,
      subject,
      description
    ],
    function (err) {
      if (err) {
        return res.status(500).json({
          error: err.message
        });
      }

      const ticketId = generateTicketId(this.lastID);

      db.run(
        `UPDATE tickets SET ticket_id=? WHERE id=?`,
        [ticketId, this.lastID]
      );

      res.status(201).json({
        ticket_id: ticketId
      });
    }
  );
});

router.get("/", (req, res) => {
  const { status, search } = req.query;

  let sql = `SELECT * FROM tickets WHERE 1=1`;
  let params = [];

  if (status) {
    sql += ` AND status=?`;
    params.push(status);
  }

  if (search) {
    sql += `
      AND (
        ticket_id LIKE ?
        OR customer_name LIKE ?
        OR customer_email LIKE ?
        OR description LIKE ?
      )
    `;

    const value = `%${search}%`;

    params.push(
      value,
      value,
      value,
      value
    );
  }

  sql += ` ORDER BY created_at DESC`;

  db.all(sql, params, (err, rows) => {
    if (err)
      return res.status(500).json({
        error: err.message
      });

    res.json(rows);
  });
});

router.get("/:ticketId", (req, res) => {
  const { ticketId } = req.params;

  db.get(
    `SELECT * FROM tickets WHERE ticket_id=?`,
    [ticketId],
    (err, ticket) => {
      if (!ticket)
        return res.status(404).json({
          error: "Ticket not found"
        });

      db.all(
        `SELECT * FROM notes WHERE ticket_id=?`,
        [ticketId],
        (err, notes) => {
          res.json({
            ...ticket,
            notes
          });
        }
      );
    }
  );
});

router.put("/:ticketId", (req, res) => {
  const { ticketId } = req.params;
  const { status, note } = req.body;

  db.run(
    `
      UPDATE tickets
      SET status=?,
      updated_at=CURRENT_TIMESTAMP
      WHERE ticket_id=?
    `,
    [status, ticketId],
    function (err) {
      if (err)
        return res.status(500).json({
          error: err.message
        });

      if (note) {
        db.run(
          `
          INSERT INTO notes
          (
            ticket_id,
            note_text
          )
          VALUES (?,?)
        `,
          [ticketId, note]
        );
      }

      res.json({
        success: true
      });
    }
  );
});

module.exports = router;