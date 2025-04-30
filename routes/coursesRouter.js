const express = require('express');
const router = express.Router();
// const courseController = require('../controllers/courseController');
const {getAllCourses,createCourse,getCourseById,updateCourse,deleteCourse} = require('../controllers/CourseController');
const passport = require('passport');
const { isTeacher, isAdmin } = require('../routes/middlewares');
// Создать курс

router.post('/courses', passport.authenticate('jwt', {session: false}),isTeacher,createCourse);

// Получить все курсы
router.get('/courses', getAllCourses);

// Получить курс по ID
router.get('/courses/:id', getCourseById);

// Обновить курс
router.put('/courses/:id',  passport.authenticate('jwt', {session: false}),isTeacher,updateCourse);

// Удалить курс
router.delete('/courses/:id',  passport.authenticate('jwt', {session: false}),isTeacher,deleteCourse);

module.exports = router;