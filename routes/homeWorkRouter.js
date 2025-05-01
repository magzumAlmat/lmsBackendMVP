// const express = require('express');
// const router = express.Router();
// const models = require('../models');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs').promises;
// const sanitizeFilename = require('sanitize-filename');

// // Настройка Multer
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'Uploads/');
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, uniqueSuffix + '-' + sanitizeFilename(file.originalname));
//   },
// });

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 1024 * 1024 * 900 }, // 900MB
// });

// // Получение всех домашних заданий
// router.get('/homeworks', async (req, res) => {
//   try {
//     const homeworks = await models.Homework.findAll({
//       include: [
//         { 
//           model: models.Lesson, 
//           as: 'lesson', 
//           include: [{ model: models.Course, as: 'course' }]
//         },
//         { model: models.File, as: 'files' },
//       ],
//     });
//     res.json(homeworks);
//   } catch (error) {
//     console.error('Error fetching all homeworks:', error);
//     res.status(500).json({ message: 'Failed to fetch homeworks' });
//   }
// });

// // Получение домашних заданий пользователя
// router.get('/homeworks/user/:user_id', async (req, res) => {
//   try {
//     const homeworks = await models.Homework.findAll({
//       where: { user_id: req.params.user_id },
//       include: [
//         { 
//           model: models.Lesson, 
//           as: 'lesson', 
//           include: [{ model: models.Course, as: 'course' }]
//         },
//         { model: models.File, as: 'files' },
//       ],
//     });
//     res.json(homeworks);
//   } catch (error) {
//     console.error('Error fetching homeworks:', error);
//     res.status(500).json({ message: 'Failed to fetch homeworks' });
//   }
// });

// // Создание домашнего задания
// router.post('/homeworks', async (req, res) => {
//   try {
//     const { user_id, lesson_id, description } = req.body;
//     const user = await models.User.findByPk(user_id);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
//     const lesson = await models.Lesson.findByPk(lesson_id);
//     if (!lesson) {
//       return res.status(404).json({ message: 'Lesson not found' });
//     }
//     const homework = await models.Homework.create({
//       user_id,
//       lesson_id,
//       description,
//       status: 'not_checked',
//     });
//     res.status(201).json(homework);
//   } catch (error) {
//     console.error('Error creating homework:', error);
//     res.status(500).json({ message: 'Failed to create homework' });
//   }
// });

// // Обновление домашнего задания
// router.put('/homeworks/:homework_id', async (req, res) => {
//   try {
//     const { status, grade } = req.body;
//     const { homework_id } = req.params;
//     console.log('Updating homework:', { homework_id, status, grade }); // Логирование входных данных
//     const homework = await models.Homework.findByPk(homework_id);
//     if (!homework) {
//       return res.status(404).json({ message: 'Homework not found' });
//     }
//     const validStatuses = ['not_checked', 'checked', 'unsatisfactory', 'satisfactory', 'good', 'excellent', 'created', 'submitted', 'graded'];
//     if (status && !validStatuses.includes(status)) {
//       console.log('Invalid status:', status);
//       return res.status(400).json({ message: 'Invalid status value' });
//     }
//     if (grade !== undefined && (typeof grade !== 'number' || grade < 0 || grade > 100)) {
//       console.log('Invalid grade:', grade);
//       return res.status(400).json({ message: 'Invalid grade value' });
//     }
//     if (status) {
//       console.log('Setting status to:', status);
//       homework.status = status;
//     }
//     if (grade !== undefined) {
//       console.log('Setting grade to:', grade);
//       homework.grade = grade;
//     }
//     if (status === 'submitted') {
//       console.log('Setting submitted_at to:', new Date());
//       homework.submitted_at = new Date();
//     }
//     await homework.save();
//     console.log('Homework updated:', homework.toJSON());
//     res.status(200).json({ status: 'success', homework });
//   } catch (error) {
//     console.error('Error updating homework:', error.message, error.stack); // Улучшенное логирование
//     res.status(500).json({ message: 'Failed to update homework', error: error.message });
//   }
// });

// // Загрузка файлов для домашнего задания
// router.post('/homeworks/:homework_id/files', upload.array('files'), async (req, res) => {
//   try {
//     const { homework_id } = req.params;
//     const files = req.files;
//     const homework = await models.Homework.findByPk(homework_id);
//     if (!homework) {
//       return res.status(404).json({ message: 'Homework not found' });
//     }
//     const fileRecords = await Promise.all(
//       files.map(async (file) => {
//         const newFilePath = path.join(path.dirname(file.path), sanitizeFilename(file.originalname));
//         await fs.rename(file.path, newFilePath);
//         return models.File.create({
//           name: file.originalname,
//           path: newFilePath,
//           mimetype: file.mimetype,
//           homework_id,
//         });
//       })
//     );
//     res.status(201).json({
//       message: 'Files uploaded successfully',
//       files: fileRecords,
//     });
//   } catch (error) {
//     console.error('Error uploading files:', error);
//     res.status(500).json({ message: 'Failed to upload files' });
//   }
// });

// // Удаление домашнего задания
// router.delete('/homeworks/:homework_id', async (req, res) => {
//   try {
//     const { homework_id } = req.params;
//     const homework = await models.Homework.findByPk(homework_id);
//     if (!homework) {
//       return res.status(404).json({ message: 'Homework not found' });
//     }
//     await homework.destroy();
//     res.status(200).json({ message: 'Homework deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting homework:', error);
//     res.status(500).json({ message: 'Failed to delete homework' });
//   }
// });

// module.exports = router;



const express = require('express');
const router = express.Router();
const models = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sanitizeFilename = require('sanitize-filename');


// Настройка Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${sanitizeFilename(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 900 }, // 900MB
});





// Маршрут для скачивания файла
router.get('/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await models.File.findByPk(fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Проверка прав доступа (опционально)
    // Например, проверить, принадлежит ли файл пользователю
    const homework = await models.Homework.findByPk(file.homework_id);
    // Здесь можно добавить логику проверки, например:
    // if (homework.user_id !== req.user.id) {
    //   return res.status(403).json({ message: 'Access denied' });
    // }

    const filePath = path.resolve(file.path);
    res.download(filePath, file.name);
  } catch (error) {
    console.error('Error downloading file:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to download file', error: error.message });
  }
});


// Загрузка файлов для домашнего задания
router.post('/homeworks/:homework_id/files', upload.array('files'), async (req, res) => {
  try {
    const { homework_id } = req.params;
    const files = req.files;

    // Проверяем существование домашнего задания и получаем lesson_id
    const homework = await models.Homework.findByPk(homework_id, {
      include: [{ model: models.Lesson, as: 'lesson' }],
    });
    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }

    // Получаем номер урока (lesson_id)
    const lessonId = homework.lesson?.id || 'Unknown';
    
    // Формируем дату в формате ГГГГ-ММ-ДД
    const currentDate = new Date().toISOString().split('T')[0]; // Например, 2025-05-01

    // Обрабатываем каждый файл
    const fileRecords = await Promise.all(
      files.map(async (file) => {
        // Формируем новое имя файла: <дата>_Lesson<lesson_id>_<оригинальное_имя>
        const sanitizedOriginalName = sanitizeFilename(file.originalname);
        const newFileName = `${currentDate}_Lesson${lessonId}_${sanitizedOriginalName}`;
        const newFilePath = path.join('uploads', newFileName);

        // Перемещаем файл с временным именем на новое
        await fs.rename(file.path, newFilePath);

        
        // Создаём запись в базе
        return models.File.create({
          name: newFileName, // Сохраняем новое имя
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
    console.error('Error uploading files:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to upload files', error: error.message });
  }
});

// Остальные маршруты (без изменений, для контекста)
router.get('/homeworks', async (req, res) => {
  try {
    const homeworks = await models.Homework.findAll({
      include: [
        { 
          model: models.Lesson, 
          as: 'lesson', 
          include: [{ model: models.Course, as: 'course' }]
        },
        { model: models.File, as: 'files' },
      ],
    });
    res.json(homeworks);
  } catch (error) {
    console.error('Error fetching all homeworks:', error);
    res.status(500).json({ message: 'Failed to fetch homeworks' });
  }
});

router.get('/homeworks/user/:user_id', async (req, res) => {
  try {
    const homeworks = await models.Homework.findAll({
      where: { user_id: req.params.user_id },
      include: [
        { 
          model: models.Lesson, 
          as: 'lesson', 
          include: [{ model: models.Course, as: 'course' }]
        },
        { model: models.File, as: 'files' },
      ],
    });
    res.json(homeworks);
  } catch (error) {
    console.error('Error fetching homeworks:', error);
    res.status(500).json({ message: 'Failed to fetch homeworks' });
  }
});

router.post('/homeworks', async (req, res) => {
  try {
    const { user_id, lesson_id, description } = req.body;
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
      status: 'not_checked',
    });
    res.status(201).json(homework);
  } catch (error) {
    console.error('Error creating homework:', error);
    res.status(500).json({ message: 'Failed to create homework' });
  }
});

router.put('/homeworks/:homework_id', async (req, res) => {
  try {
    const { status, grade } = req.body;
    const { homework_id } = req.params;
    console.log('Updating homework:', { homework_id, status, grade });
    const homework = await models.Homework.findByPk(homework_id);
    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }
    const validStatuses = ['not_checked', 'checked', 'unsatisfactory', 'satisfactory', 'good', 'excellent', 'created', 'submitted', 'graded'];
    if (status && !validStatuses.includes(status)) {
      console.log('Invalid status:', status);
      return res.status(400).json({ message: 'Invalid status value' });
    }
    if (grade !== undefined && (typeof grade !== 'number' || grade < 0 || grade > 100)) {
      console.log('Invalid grade:', grade);
      return res.status(400).json({ message: 'Invalid grade value' });
    }
    if (status) {
      console.log('Setting status to:', status);
      homework.status = status;
    }
    if (grade !== undefined) {
      console.log('Setting grade to:', grade);
      homework.grade = grade;
    }
    if (status === 'submitted') {
      console.log('Setting submitted_at to:', new Date());
      homework.submitted_at = new Date();
    }
    await homework.save();
    console.log('Homework updated:', homework.toJSON());
    res.status(200).json({ status: 'success', homework });
  } catch (error) {
    console.error('Error updating homework:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to update homework', error: error.message });
  }
});

router.delete('/homeworks/:homework_id', async (req, res) => {
  try {
    const { homework_id } = req.params;
    const homework = await models.Homework.findByPk(homework_id);
    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }
    await homework.destroy();
    res.status(200).json({ message: 'Homework deleted successfully' });
  } catch (error) {
    console.error('Error deleting homework:', error);
    res.status(500).json({ message: 'Failed to delete homework' });
  }
});

module.exports = router;