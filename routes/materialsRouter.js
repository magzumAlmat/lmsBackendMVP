const express = require('express');
const router = express.Router();
const materialController = require('../controllers/MaterialController');
const { isTeacher, isAdmin } = require('../routes/middlewares');
const passport = require('passport');
// Создать материал
router.post('/materials',  passport.authenticate('jwt', {session: false}),isTeacher,materialController.createMaterial);

// Получить все материалы
router.get('/materials', materialController.getAllMaterials);

// Получить материал по ID
router.get('/materials/:id', materialController.getMaterialById);

// router.get('/materialsbycourseid/:id', materialController.getLessonByCourseId);


// Обновить материал
router.put('/materials/:id', passport.authenticate('jwt', {session: false}),isTeacher, materialController.updateMaterial);

// Удалить материал
router.delete('/materials/:id',  passport.authenticate('jwt', {session: false}),isTeacher,materialController.deleteMaterial);

module.exports = router;