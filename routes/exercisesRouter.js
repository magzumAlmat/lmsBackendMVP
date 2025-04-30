const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/ExerciseController');

// Создать упражнение
router.post('/exercises', exerciseController.createExercise);

// Получить все упражнения
router.get('/exercises', exerciseController.getAllExercises);

// Получить упражнение по ID
router.get('/exercises/:id', exerciseController.getExerciseById);

// Обновить упражнение
router.put('/exercises/:id', exerciseController.updateExercise);

// Удалить упражнение
router.delete('/exercises/:id', exerciseController.deleteExercise);

module.exports = router;