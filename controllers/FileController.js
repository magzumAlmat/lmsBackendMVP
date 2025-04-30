const File = require("../models/File");
const fs = require("fs");
const path = require("path");

// Upload a file
// const uploadFile = async (req, res) => {
//   try {
//     console.log("Uploaded file:", req.file,' this is req body- ',req.body.name);

//     const { originalname, mimetype, path: filePath } = req.file;
//     console.log('THIS IS FilePAth-', filePath)

//     const correctName=req.body.name
//     console.log('correct name= ',correctName)
//     // const decodedFileName = decodeURIComponent(req.file.originalname);
//     // console.log("Decoded file name:", decodedFileName);

//     const file = await File.create({
//       name: correctName,
//       path: filePath,
//       originalname:correctName,
//       mimetype,
//     });

//     const newFile = {
//       ...file, // Копируем все свойства из исходного файла
//       originalname: correctName, // Меняем имя файла
//     };

//     console.log('newFile=',newFile.originalname)

//     res.status(201).json({
//       message: "File uploaded successfully!",
//       newFile,
//     });
//   } catch (error) {
//     console.error("Error uploading file:", error);
//     res.status(500).json({ message: "File upload failed." });
//   }
// };


const uploadFile = async (req, res) => {
  try {
    console.log("Uploaded file:", req.file, 'this is req body-', req.body.name);

    const { originalname, mimetype, path: filePath } = req.file;
    console.log('THIS IS FilePath-', filePath);

    const correctName = req.body.name 
    console.log('correct name=', correctName);

    const file = await File.create({
      name: correctName,
      path: filePath,
      originalname: correctName,
      mimetype,
    });

    const newFile = {
      ...file.toJSON(), // Копируем все свойства из исходного файла
      originalname: correctName, // Меняем имя файла
    };

    console.log('newFile=', newFile.originalname);

    res.status(201).json({
      message: "File uploaded successfully!",
      newFile,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ message: "File upload failed." });
  }
};

// List all files
const listFiles = async (req, res) => {
  try {
    const files = await File.findAll();
    res.status(200).json(files);
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ message: "Failed to fetch files." });
  }
};

// Fetch a single file by ID
const getFileById = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await File.findByPk(id);

    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }

    res.status(200).json(file);
  } catch (error) {
    console.error("Error fetching file:", error);
    res.status(500).json({ message: "Failed to fetch file." });
  }
};

// Update file metadata
const updateFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const file = await File.findByPk(id);

    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }

    file.name = name || file.name;
    await file.save();

    res.status(200).json({
      message: "File updated successfully.",
      file,
    });
  } catch (error) {
    console.error("Error updating file:", error);
    res.status(500).json({ message: "Failed to update file." });
  }
};

// Delete a file
const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;

    const file = await File.findByPk(id);

    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }

    // Delete the file from the file system
    fs.unlink(file.path, async (err) => {
      if (err) {
        console.error("Error deleting file from disk:", err);
        return res.status(500).json({ message: "Failed to delete file." });
      }

      // Delete the file record from the database
      await file.destroy();
      res.status(200).json({ message: "File deleted successfully." });
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ message: "Failed to delete file." });
  }
};

module.exports = {
  uploadFile,
  listFiles,
  getFileById,
  updateFile,
  deleteFile,
};