const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { readdirSync } = require("fs");
const path = require("path");
const morgan = require("morgan");
const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// loop router
const routesDir = path.join(__dirname, "routes");
readdirSync(routesDir).map((r) =>
    app.use("/", require(path.join(routesDir, r)))
);

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

module.exports = app;
