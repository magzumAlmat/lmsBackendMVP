const express = require('express');
const router = express.Router();
const models = require('../models'); // Импортируем модели из models/index.js
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Настройка Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 900 }, // 900MB
});

// Получение всех домашних заданий пользователя
router.get('/homeworks/user/:user_id', async (req, res) => {
  try {
    // Логируем ассоциации для отладки
    console.log('Homework associations:', models.Homework.associations);

    const homeworks = await models.Homework.findAll({
      where: { user_id: req.params.user_id },
      include: [
        { model: models.Lesson, as: 'lesson' },
        { model: models.File, as: 'files' },
      ],
    });
    res.json(homeworks);
  } catch (error) {
    console.error('Error fetching homeworks:', error);
    res.status(500).json({ message: 'Failed to fetch homeworks' });
  }
});

// Создание домашнего задания
router.post('/homeworks', async (req, res) => {
  try {
    const { user_id, lesson_id, description } = req.body;

    // Валидация
    const user = await models.User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const lesson = await models.Lesson.findByPk(lesson_id);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    const homework = await models.Homework.create({
      user_id,
      lesson_id,
      description,
      status: 'created',
    });
    res.status(201).json(homework);
  } catch (error) {
    console.error('Error creating homework:', error);
    res.status(500).json({ message: 'Failed to create homework' });
  }
});

// Загрузка файлов для домашнего задания
router.post('/homeworks/:homework_id/files', upload.array('files'), async (req, res) => {
  try {
    const { homework_id } = req.params;
    const files = req.files;

    const homework = await models.Homework.findByPk(homework_id);
    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }

    const fileRecords = await Promise.all(
      files.map(async (file) => {
        const newFilePath = path.join(path.dirname(file.path), file.originalname);
        await fs.rename(file.path, newFilePath);

        return models.File.create({
          name: file.originalname,
          path: newFilePath,
          mimetype: file.mimetype,
          homework_id,
        });
      })
    );

    res.status(201).json({
      message: 'Files uploaded successfully',
      files: fileRecords,
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ message: 'Failed to upload files' });
  }
});

// Обновление домашнего задания
router.put('/homeworks/:homework_id', async (req, res) => {
  try {
    const { status, grade } = req.body;
    const homework = await models.Homework.findByPk(req.params.homework_id);
    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }

    if (status && !['created', 'submitted', 'graded'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    if (grade !== undefined && (typeof grade !== 'number' || grade < 0 || grade > 100)) {
      return res.status(400).json({ message: 'Invalid grade value' });
    }

    homework.status = status || homework.status;
    homework.grade = grade !== undefined ? grade : homework.grade;
    if (status === 'submitted') {
      homework.submitted_at = new Date();
    }
    await homework.save();

    res.json(homework);
  } catch (error) {
    console.error('Error updating homework:', error);
    res.status(500).json({ message: 'Failed to update homework' });
  }
});

module.exports = router;