const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const File = require("./models/File");
const passport = require("passport");
const cluster = require("cluster"); // Import the cluster module
const os = require("os"); // Import os module to get CPU count

const PORT = 4000;

if (cluster.isMaster) {
  // Master process
  const numCPUs = os.cpus().length; // Get number of CPU cores

  console.log(`Master process ${process.pid} is running`);
  console.log(`Forking ${numCPUs} workers`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Listen for dying workers
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    // Optional: Fork a new worker if one dies
    cluster.fork();
  });
} else {
  // Worker processes
  const app = express();
  const User = require("./auth/models/User");

  console.log(`Worker ${process.pid} started`);

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "200mb" }));
  app.use(express.urlencoded({ extended: true, limit: "900mb" }));
  app.use(passport.initialize());

  // Basic route to test
  app.get("/", async (req, res) => {
    try {
      const users = await User.findAll({
        attributes: ["id", "name", "email"],
      });
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch users", error: error.message });
    }
  });

  // Роутеры
  const courseRouter = require("./routes/coursesRouter");
  const materialRoutes = require("./routes/materialsRouter");
  const lessonRoutes = require("./routes/lessonsRouter");
  const exerciseRoutes = require("./routes/exercisesRouter");
  const progressRoutes = require("./routes/progressesRouter");
  const streamRoutes = require("./routes/streamRouter");
  const fileRoutes = require("./routes/fileRouter");
  const homeworkRoutes = require("./routes/homeWorkRouter");

  app.use(require("./auth/routes"));
  app.use("/api", courseRouter);
  app.use("/api", materialRoutes);
  app.use("/api", lessonRoutes);
  app.use("/api", exerciseRoutes);
  app.use("/api", progressRoutes);
  app.use("/api", streamRoutes);
  app.use("/api", fileRoutes);
  app.use("/api", homeworkRoutes);

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });

  // Настройка Multer
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/"); // Файлы сохраняются в папку "uploads"
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + "-" + file.originalname); // Уникальное имя файла
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
      "application/msword", // DOC
      "application/pdf", // PDF
      "image/vnd.djvu", // DJVU
      "image/x-djvu", // DJVU (альтернативный MIME-тип)
      "video/mp4", // MP4
      "*/*",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      // Добавленные форматы изображений
      "image/jpeg", // JPEG, JPG
      "image/png", // PNG
      "image/gif", // GIF
      "image/bmp", // BMP
      "image/webp", // WebP
      "image/tiff", // TIFF
      "image/x-icon", // ICO (иконки)
      "image/svg+xml", // SVG
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only Word, PDF, DJVU, and MP4 files are allowed."
        )
      );
    }
  };

  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 1024 * 1024 * 900, // 900MB
    },
    fileFilter: fileFilter,
  }).single("file");

  app.post(
    "/api/upload",
    (req, res, next) => {
      upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
          console.error("Multer error:", err);
          if (err.code === "LIMIT_FILE_SIZE") {
            return res
              .status(413)
              .json({
                message: "File too large. Maximum size allowed is 900MB.",
              });
          }
          return res
            .status(500)
            .json({ message: "Multer error: " + err.message });
        } else if (err) {
          console.error("Other upload error:", err);
          return res.status(500).json({ message: err.message });
        }
        next();
      });
    },
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).send("No file uploaded.");
        }

        const { originalname, path: filePath } = req.file;
        const correctName = req.body.name || originalname;

        console.log("File uploaded to folder:", correctName);

        const newFilePath = path.join(
          path.dirname(filePath),
          correctName + path.extname(originalname)
        );
        await fs.promises.rename(filePath, newFilePath);

        const newFile = await File.create({
          name: correctName,
          path: newFilePath,
          originalname: correctName,
          mimetype: req.file.mimetype,
        });

        res.status(201).json({
          message: "File uploaded and renamed successfully!",
          newFile,
        });
      } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).json({ message: "File upload failed." });
      }
    }
  );

  // Статическая раздача файлов
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  // Запуск сервера
  app.listen(PORT, (err) => {
    if (err) {
      console.error("Server failed to start:", err);
      process.exit(1);
    }
    console.log(`Worker ${process.pid} started and listening on port ${PORT}`);
  });
}