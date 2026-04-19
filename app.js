const express = require("express");
const cors = require("cors");
const databaseConnection = require("./utility/db");
const profileRoutes = require("./routes/profileRoutes");
const dns =  require("node:dns");

dns.setServers(["1.1.1.1", "8.8.8.8"])

const app = express();

const PORT = process.env.PORT || 8080;

app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/", (req, res) => {
  return res.json({ message: "server is running" });
});

app.use("/api/profiles", profileRoutes);

app.use((err, req, res, next) => {
  console.error(err); // log for debugging (replace with logger in prod)

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    status: "error",
    message: err.message || "Internal Server Error",
  });
});

databaseConnection(() => {
  app.listen(PORT, () => {
    console.log(`Server is live at http://localhost:${PORT}`);
  });
});
