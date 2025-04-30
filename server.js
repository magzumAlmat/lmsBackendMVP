// const express= require('express');
// const cors=require('cors');
// // const dotenv=require('dotenv');
// // dotenv.config();
// const fs = require("fs");
// const path = require("path");
// const passport =require('passport')
// // const { sequelize } = require('./models/Courses');
// const multer = require("multer");
// const File = require("./models/File");
// const PORT=4000;
// const app=express();
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // app.use(express.static(path.join(__dirname)));
// app.use(passport.initialize());

// const courseRouter = require('./routes/coursesRouter'); // Импортируем роутер
// const materialRoutes = require('./routes/materialsRouter');
// const lessonRoutes   = require('./routes/lessonsRouter');
// const exerciseRoutes = require('./routes/exercisesRouter');
// const progressRoutes = require('./routes/progressesRouter');
// const streamRoutes=require('./routes/streamRouter');
// const fileRoutes=require('./routes/fileRouter');
// // app.use(express.json());




// // app.use(express.static(__dirname+'/public'))



// app.use(require('./auth/routes'))

// app.use('/api', courseRouter); 
// app.use('/api', materialRoutes); 

// app.use('/api', lessonRoutes); 
// app.use('/api', exerciseRoutes); 

// app.use('/api', progressRoutes); 
// app.use('/api', streamRoutes); 
// app.use("/api", fileRoutes);

// // sequelize.sync({ force: false })
// //   .then(() => {
// //     console.log('База данных синхронизирована');
// //   })
// //   .catch((error) => {
// //     console.error('Ошибка синхронизации базы данных:', error);
// //   });
 

// // app.use('/api', materialRoutes);
// // app.use('/api', lessonRoutes);
// // app.use('/api', exerciseRoutes);
// // app.use('/api', progressRoutes);



// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//     cb(null, "uploads/"); // Directory where files will be stored
//     },
//     filename: (req, file, cb) => {
//     console.log('1 req.body.name from multer= ', req.body.name); // Теперь req.body.name будет доступен
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, uniqueSuffix + "-" + file.originalname);
//     },
// });
  
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = [
//     "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
//     "application/msword", // DOC
//     "application/pdf", // PDF
//     "image/vnd.djvu", // DJVU
//     "image/x-djvu", // DJVU (альтернативный MIME-тип)
//     "video/mp4"
//   ];
//     if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//     } else {
//     cb(new Error("Invalid file type. Only Word files are allowed."));
//     }
// };
//   // Multer middleware
 


// //   app.post("/upload", upload.single("file"), async(req, res) => {
// //     if (!req.file) {
// //       return res.status(400).send("No file uploaded.");
// //     }
  
// //     const { originalname, path: filePath } = req.file;
// //     const correctName = req.body.name.slice(0, -5); 
// //     console.log('multer при upload файла в папку- ',correctName)
  
// //     // Переименовываем файл
// //     const newFilePath = path.join(
// //       path.dirname(filePath),
// //       correctName + path.extname(originalname)
// //     );
  
// //     fs.rename(filePath, newFilePath, (err) => {
// //       if (err) {
// //         console.error("Error renaming file:", err);
// //         return res.status(500).send("Error renaming file.");
// //       }
  
// //       res.send("File uploaded and renamed successfully.");
// //     });

// //     try {
// //         console.log("Uploaded file:", req.file, 'this is req body-', req.body.name);
    
// //         const { originalname, mimetype, path: filePath } = req.file;
// //         console.log('THIS IS FilePath-', filePath);
    
// //         const correctName = req.body.name.slice(0, -5); 
        
// //         console.log('!@!!correct name=', correctName);
    
// //         const file = await File.create({
// //           name: correctName,
// //           path: newFilePath,
// //           originalname: correctName,
// //           mimetype,
// //         });
    
// //         const newFile = {
// //           ...file.toJSON(), // Копируем все свойства из исходного файла
// //           originalname: correctName, // Меняем имя файла
// //         };
    
// //         console.log('newFile=', newFile.originalname);
    
// //         res.status(201).json({
// //           message: "File uploaded successfully!",
// //           newFile,
// //         });
// //       } catch (error) {
// //         console.error("Error uploading file:", error);
// //         res.status(500).json({ message: "File upload failed." });
// //       }
// // })
// //app.use(upload.any())  парсинг формдаты


// // app.get('/',(req,res)=>{
// //     res.send('OK!')
// // })

// // app.post('/api',(req,res)=>{
// //     console.log(req.body)
// //     res.status(200).send('POST /api works | Success!')
// // })

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 1024 * 1024 * 900, // Max file size: 10MB
//   },
//   fileFilter: fileFilter,
// });


// app.post("/api/upload", upload.single("file"), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).send("No file uploaded.");
//     }

//     const { originalname, path: filePath } = req.file;
//     const correctName = req.body.name ;

//     console.log("multer при upload файла в папку-", correctName);

//     // Переименовываем файл
//     const newFilePath = path.join(
//       path.dirname(filePath),
//       correctName + path.extname(originalname)
//     );

//     await fs.promises.rename(filePath, newFilePath);

//     // Создание записи в базе данных
//     const newFile = await File.create({
//       name: correctName,
//       path: newFilePath,
//       originalname: correctName,
//       mimetype: req.file.mimetype,
//     });

//     res.status(201).json({
//       message: "File uploaded and renamed successfully!",
//       newFile,
//     });
//   } catch (error) {
//     if (error instanceof multer.MulterError) {
//       // Handle Multer-specific errors
//       if (error.code === "LIMIT_FILE_SIZE") {
//         return res.status(413).json({ message: "File too large. Maximum size allowed is 10MB." });
//       }
//     } else {
//       // Handle other errors
//       console.error("Error uploading file:", error);
//       res.status(500).json({ message: "File upload failed." });
//     }
//   }
// });


// app.listen(PORT,(err)=>{
//     if(err){
//         process.exit(1);
//     }
//     console.log(`SERVER RUN AT${{PORT}}`)
// });



const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const File = require("./models/File");
const passport =require('passport')
const PORT = 4000;
const app = express();

// Middleware
app.use(cors());

app.use(express.json({ limit: "200mb" })); // Увеличиваем лимит для JSON 200 mb
app.use(express.urlencoded({ extended: true, limit: "900mb" })); // Увеличиваем лимит для URL-encoded данных 900mb

app.use(passport.initialize());

// Роутеры
const courseRouter = require('./routes/coursesRouter');
const materialRoutes = require('./routes/materialsRouter');
const lessonRoutes = require('./routes/lessonsRouter');
const exerciseRoutes = require('./routes/exercisesRouter');
const progressRoutes = require('./routes/progressesRouter');
const streamRoutes = require('./routes/streamRouter');
const fileRoutes = require('./routes/fileRouter');
const homeworkRoutes = require('./routes/homeWorkRouter');

app.use(require('./auth/routes'));
app.use('/api', courseRouter);
app.use('/api', materialRoutes);
app.use('/api', lessonRoutes);
app.use('/api', exerciseRoutes);
app.use('/api', progressRoutes);
app.use('/api', streamRoutes);
app.use("/api", fileRoutes);
app.use("/api", homeworkRoutes);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
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
    "image/svg+xml" // SVG

  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only Word, PDF, DJVU, and MP4 files are allowed."));
  }
};

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 1024 * 1024 * 900, // Максимальный размер файла: 900MB
//   },
//   fileFilter: fileFilter,
// });

// Обработчик загрузки файлов
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 900, // 900MB
  },
  fileFilter: fileFilter,
}).single("file");

// Обработчик загрузки файлов
app.post("/api/upload", (req, res, next) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer error:", err);
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ message: "File too large. Maximum size allowed is 900MB." });
      }
      return res.status(500).json({ message: "Multer error: " + err.message });
    } else if (err) {
      console.error("Other upload error:", err);
      return res.status(500).json({ message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const { originalname, path: filePath } = req.file;
    const correctName = req.body.name || originalname;

    console.log("File uploaded to folder:", correctName);

    const newFilePath = path.join(path.dirname(filePath), correctName + path.extname(originalname));
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
});
// app.post("/api/upload", upload.single("file"), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).send("No file uploaded.");
//     }

//     const { originalname, path: filePath } = req.file;
//     const correctName = req.body.name || originalname; // Используем имя из тела запроса или оригинальное имя файла

//     console.log("File uploaded to folder:", correctName);

//     // Переименовываем файл
//     const newFilePath = path.join(
//       path.dirname(filePath),
//       correctName + path.extname(originalname)
//     );

//     await fs.promises.rename(filePath, newFilePath);

//     // Создаем запись в базе данных
//     const newFile = await File.create({
//       name: correctName,
//       path: newFilePath,
//       originalname: correctName,
//       mimetype: req.file.mimetype,
//     });

//     res.status(201).json({
//       message: "File uploaded and renamed successfully!",
//       newFile,
//     });
//   } catch (error) {
//     if (error instanceof multer.MulterError) {
//       // Обработка ошибок Multer
//       if (error.code === "LIMIT_FILE_SIZE") {
//         return res.status(413).json({ message: "File too large. Maximum size allowed is 900MB." });
//       }
//     } else {
//       // Обработка других ошибок
//       console.error("Error uploading file:", error);
//       res.status(500).json({ message: "File upload failed." });
//     }
//   }
// });

// Статическая раздача файлов
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Запуск сервера
app.listen(PORT, (err) => {
  if (err) {
    console.error("Server failed to start:", err);
    process.exit(1);
  }
  console.log(`Server is running at http://localhost:${PORT}`);
});