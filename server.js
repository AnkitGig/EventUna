const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const morgan = require("morgan");
const connectDB = require("./config/db");
const indexRoutes = require("./routes/indexRoutes");
const productRoutes = require("./routes/productRoutes");
const { createDirectories } = require("./utils/directorySetup");
const multer = require("multer"); // Import multer

const fs = require("fs");
const mime = require("mime");


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Create necessary directories on startup
createDirectories();

// ✅ Connect to DB
connectDB();

// ✅ Middlewares
app.use(express.json());
app.use(morgan("dev"));

// Product/category/subcategory APIs
app.use("/api/products", productRoutes);



app.get("/api/merchant/locations/:filename", (req, res) => {
  const filePath = path.join(__dirname, "public/merchant/locations", req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (!range) {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": mime.getType(filePath),
      "Content-Disposition": "inline"
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    const chunkSize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": mime.getType(filePath),
      "Content-Disposition": "inline"
    });

    file.pipe(res);
  }
});

// ✅ Static Files
app.use("/api", express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "view")));

// ✅ Routes
app.use("/api", indexRoutes);

// ✅ Global Error Handler for Multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        status: false,
        message:
          "File too large. Maximum size allowed is 10MB for documents and 50MB for videos.",
      });
    }
  }

  if (error.message.includes("Invalid file type")) {
    return res.status(400).json({
      status: false,
      message: error.message,
    });
  }

  console.error("Server Error:", error);
  res.status(500).json({
    status: false,
    message: "Internal server error",
  });
});

// ✅ Root Route
app.get("/", (req, res) => {
  res.send("API is running...");
});




// ✅ Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
