const express = require("express");
const cors = require("cors");
const { Pool } = require("pg"); // Import postgres pool client

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// PostgreSQL Pool Configuration from environment variables
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432, // Default Postgres port is 5432
});

// Initialize database table if not exists
const initializeDatabase = async () => {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS items (
                name VARCHAR(255) PRIMARY KEY,
                number INTEGER NOT NULL
            );
        `);
    console.log('Database table "items" initialized or already exists.');
  } catch (err) {
    console.error("Error initializing database table:", err);
  }
};

initializeDatabase(); // Call the initialization function
// Test database connection
pool
  .connect()
  .then(() => console.log("Connected to PostgreSQL database!"))
  .catch((err) => console.error("Error connecting to PostgreSQL:", err));

// API Endpoints

// GET all items
app.get("/api/items", async (req, res) => {
  try {
    const result = await pool.query("SELECT name, number FROM items"); // Fetch from database
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching items from database:", err);
    res.status(500).json({ message: "Failed to fetch items from database" });
  }
});

// POST a new item
app.post("/api/items", async (req, res) => {
  const newItem = req.body;
  if (!newItem.name || typeof newItem.number !== "number") {
    return res.status(400).json({
      message:
        "Invalid item format. Name (string) and number (number) are required.",
    });
  }

  try {
    // Check if item with same name exists
    const checkResult = await pool.query(
      "SELECT name FROM items WHERE name = $1",
      [newItem.name],
    );
    if (checkResult.rows.length > 0) {
      return res
        .status(409)
        .json({ message: "Item with this name already exists." });
    }

    const result = await pool.query(
      "INSERT INTO items (name, number) VALUES ($1, $2) RETURNING name, number",
      [newItem.name, newItem.number],
    );
    res.status(201).json(result.rows[0]); // Created
  } catch (err) {
    console.error("Error adding item to database:", err);
    res.status(500).json({ message: "Failed to add item to database" });
  }
});

// DELETE an item by name
app.delete("/api/items/:name", async (req, res) => {
  const nameToDelete = req.params.name;
  try {
    const result = await pool.query(
      "DELETE FROM items WHERE name = $1 RETURNING name",
      [nameToDelete],
    );
    if (result.rows.length > 0) {
      res
        .status(200)
        .json({ message: `Item '${nameToDelete}' deleted successfully.` });
    } else {
      res.status(404).json({ message: `Item '${nameToDelete}' not found.` });
    }
  } catch (err) {
    console.error("Error deleting item from database:", err);
    res.status(500).json({ message: "Failed to delete item from database" });
  }
});

// PUT/PATCH update an item's number by name
app.put("/api/items/:name", async (req, res) => {
  const nameToUpdate = req.params.name;
  const updatedNumber = req.body.number;

  if (typeof updatedNumber !== "number") {
    return res
      .status(400)
      .json({ message: "Invalid update format. Number must be a number." });
  }

  try {
    const result = await pool.query(
      "UPDATE items SET number = $1 WHERE name = $2 RETURNING name, number",
      [updatedNumber, nameToUpdate],
    );
    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ message: `Item '${nameToUpdate}' not found.` });
    }
  } catch (err) {
    console.error("Error updating item in database:", err);
    res.status(500).json({ message: "Failed to update item in database" });
  }
});

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1"); // Simple query to check database connection
    res.status(200).send("OK");
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).send("Service Unavailable"); // Indicate service is not healthy
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
