const express = require('express');
const router = express.Router();
// const courseController = require('../controllers/courseController');
const {getStreamStudents,createStream,addStudentsToStream,getAllStreams,getStreamById,updateStream,deleteStream,removeStudentsFromStream} = require('../controllers/StreamController');
const passport = require('passport');
const { isTeacher, isAdmin } = require('./middlewares');
// Создать курс

router.post('/stream', createStream);
router.post('/streams/:streamId/students', addStudentsToStream);
        //  api/streams/getstudentsbystreamid/
router.get('/streams/getstudentsbystreamid/:streamId',getStreamStudents)
router.post('/streams/:streamId/remove-students',removeStudentsFromStream)
router.get('/streams',getAllStreams)
router.get('/streams/:streamId',getStreamById)
router.put('/streams/:streamId',updateStream)
router.delete('/streams/:streamId',deleteStream)
// // Получить все курсы
// router.get('/courses', getAllCourses);

// // Получить курс по ID
// router.get('/courses/:id', getCourseById);

// // Обновить курс
// router.put('/courses/:id',  passport.authenticate('jwt', {session: false}),isTeacher,updateCourse);

// // Удалить курс
// router.delete('/courses/:id',  passport.authenticate('jwt', {session: false}),isTeacher,deleteCourse);

module.exports = router;