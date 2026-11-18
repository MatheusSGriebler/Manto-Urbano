import "dotenv/config";
import "./config/env.js";
import server from "./App.js";
const port = Number(process.env.PORT || 3000);
server.listen(port);
console.log(`Server running on port ${port}`);
