const express = require("express");
const connectDB = require("./config/connectDB");

const app = express();
const PORT = 5000;
const HOST = "127.0.0.1";


app.use(express.json());

app.get("/", async (req, res) => {
    try {
      const ref = await connectDB("testDB");
      ref.on(
      "value",
      (snapshot) => {   
        console.log(snapshot.val());
      },
      (errorObject) => {
        console.log("The read failed: " + errorObject.name);
      }
    );
  } catch (e) {
    console.log(e.message)
    return res.status(500).json({msg: 'Internal Server Error'});
  }
});
const server = app.listen(PORT, HOST);
console.log("Server running in ", PORT);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit);
});
