const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/LessonController');

// Создать урок
router.post('/lessons', lessonController.createLesson);

// Получить все уроки
router.get('/lessons', lessonController.getAllLessons);

// Получить урок по ID
router.get('/lessons/:id', lessonController.getLessonById);

// Обновить урок
router.put('/lessons/:id', lessonController.updateLesson);

// Удалить урок
router.delete('/lessons/:id', lessonController.deleteLesson);

router.post('/lessons/review', lessonController.submitReview);
router.post('/lessons/:id/priority',lessonController.setLessonPriority)
router.get('/lessons/:id/priority',lessonController.getLessonPriority)
module.exports = router;