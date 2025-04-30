const express = require('express');
const router = express.Router();
const progressController = require('../controllers/ProgressController');
const {createInitialProgress,updateFinishedStatus}=require('../controllers/ProgressController')
const { isTeacher, isAdmin } = require('../routes/middlewares');
const Course=require('../models/Courses')
// Создать запись о прогрессе


router.put("/course/progress/update-finished/:userId", updateFinishedStatus);

router.post('/progresses', progressController.createProgress);

// Получить все записи о прогрессе
router.get('/course/progress/:user_id/:course_id', progressController.getCourseProgress);

router.put('/progress/update',progressController.assignProgress)

router.post('/course/enroll', progressController.initialProgress);


router.get('/progress/all/:user_id', progressController.getAllProgressesWithCourseProgress);

// router.get('/progresses/:userid', progressController.getProgressByUserId);
// Получить запись о прогрессе по ID
router.get('/progresses/:id', progressController.getProgressById);

// Обновить запись о прогрессе
router.put('/progresses/:id', progressController.updateProgress);

// Удалить запись о прогрессе
router.delete('/progresses/:id', progressController.deleteProgress);

module.exports = router;