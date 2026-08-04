const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", require("./api/health"));
app.use("/api", require("./api/create-order"));
app.use("/api", require("./api/verify-payment"));
app.use("/api", require("./api/free-enrollment"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});