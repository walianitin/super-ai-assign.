const express = require("express");
const app = express();
const port = 3001;
const duckdb = require("duckdb");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const _ = require("lodash");

app.use(cors());

// Initialize a DuckDB database
const db = new duckdb.Database("yeti.db"); // Use ':memory:' for an in-memory database, or specify a file path for persistence

// Create a connection
const connection = db.connect();
app.use(express.json());

// Example: Create a table
connection.run(
  "CREATE TABLE bills (id INTEGER, region TEXT, items TEXT, totalAmount INTEGER)",
  (err) => {
    if (err) {
      console.error("Error created table:", err);
    } else {
      console.log("Table created successfully.");
    }
  }
);

const foodItems = [
  "Virgin Mojito",
  "Momos",
  "Burger",
  "Pizza",
  "Chicken Tikka",
  "Paneer Tikka",
  "Pasta",
  "Garlic Bread",
  "Shake",
  "Masala Tea",
];

app.post("/createUser", (req, res) => {
  const number = req?.body?.number;
  let randomNum = Math.floor(Math.random() * 10);
  let foodItemsInOrder = [];

  for (let i = 0; i < randomNum; i++) {
    const fooditem = foodItems[Math.floor(Math.random() * 10)];
    foodItemsInOrder.push(fooditem);
  }

  foodItemsInOrder.join(",");
  let totalAmount = Math.random() * 1000;
  totalAmount = parseFloat(totalAmount).toFixed(2);

  connection.all("SELECT COUNT(*) AS total_rows FROM bills", (err, rows) => {
    if (err) {
      console.error("Error querying row count:", err);
    } else {
      const totalItems = Number(rows[0].total_rows);
      for (let i = totalItems; i < totalItems + number; i++) {
        connection.run(
          `INSERT INTO bills VALUES (${
            i + 1
          }, '${foodItemsInOrder}', '${totalAmount}')`
        );
      }
      res.json("Success");
    }
  });
});

app.get("/getAllUsers", (req, res) => {
  connection.all(
    "SELECT * FROM bills Order by id DESC LIMIT 5",
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: "Unable to get users" });
      } else {
        res.json(rows);
      }
    }
  );
});

app.delete("/deleteUser/:id", (req, res) => {
  const userId = req.params.id;

  connection.run(
    `DELETE FROM users WHERE id = ?`,
    [userId], // Use the user ID passed in the URL
    (err) => {
      if (err) {
        console.error("Error deleting user:", err);
        return res
          .status(500)
          .json({ error: "Unable to delete the user", details: err.message });
      } else {
        return res.json({ message: "User Deleted Successfully" });
      }
    }
  );
});

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// We are closing the connection of duckSB explicitly because our database is file based and not purely in memory
const closeConnection = () => {
  connection.close((err) => {
    if (err) {
      console.error("Error closing the DuckDB connection:", err);
    } else {
      console.log("DuckDB connection closed gracefully.");
    }
    process.exit(0); // Exit the process
  });
};

process.on("SIGINT", closeConnection); // User interrupt (e.g., Ctrl+C)
process.on("SIGTERM", closeConnection); // Termination signal (e.g., from Docker/Kubernetes)

// Optional: Handle unexpected errors
process.on("uncaughtException", (err) => {
  console.error("Unhandled exception:", err);
  closeConnection();
});

// Items = ['idli', 'burger', 'sandwich']
// bills =[]

// for(int i=0;i<10;i++)
//   {
//     bill = items

//   }
