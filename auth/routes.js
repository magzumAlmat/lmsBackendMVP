
const express = require('express');
const router = express.Router();
const {
  checkEmail,
  aUTH,
  verifyLink,
  sendVerificationEmail,
  verifyCode,
  signUp,
  logIn,
  logOut,
  createCompany,
  verifyCodeInspector,
  addFullProfile,
  allCompanies,
  companySearchByBin,
  companySearchByContactPhone,
  companySearchByName,
  companySearchByContactEmail,
  getAuthenticatedUserInfo,
  updateUserRole,
  getAllUsers,
  forgotPassword,
  resetPassword,
  exportReviewsToExcel,
  // authenticateJWTForLogout 
} = require('./controllers');
const { validateSignUp, isAdmin, isStudent, isTeacher, authenticateJWT, authenticateJWTForLogout } = require('./middlewares');
const { upload } = require('./utils');
const passport = require('passport');
const User = require('./models/User');
const { Op } = require('sequelize');

// Логирование всех запросов
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Авторизация
router.get('/api/auth/check-email', checkEmail);
router.post('/api/register', aUTH);
router.post('/api/auth/login', logIn);
router.post('/api/auth/logout', authenticateJWTForLogout, logOut);
router.post('/api/auth/verifycode', verifyCode);
router.post('/api/auth/inspector/verifycode', verifyCodeInspector);
router.get('/api/auth/verifylink/:id', verifyLink);
router.post('/api/forgot-password', forgotPassword);
router.post('/api/auth/reset-password', resetPassword);

// Google OAuth
router.get(
  '/api/auth/google',
  passport.authenticate('google', { scope: ['openid', 'email', 'profile'] })
);
router.get(
  '/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    const { user, token } = req.user;
    res.redirect(`${process.env.FRONTEND_URL}/layout?token=${token}`);
  }
);

// Управление пользователями
router.put('/api/users/:userId/role', passport.authenticate('jwt', { session: false }), isAdmin, updateUserRole);
router.post('/api/auth/addfullprofile', passport.authenticate('jwt', { session: false }), addFullProfile);
router.get('/api/getallusers', passport.authenticate('jwt', { session: false }),
//  isAdmin,
  getAllUsers);
router.get('/api/auth/getAuthentificatedUserInfo', passport.authenticate('jwt', { session: false }), getAuthenticatedUserInfo);

// Компании
router.post('/api/auth/createcompany', passport.authenticate('jwt', { session: false }), createCompany);
router.get('/api/auth/getallcompanies', passport.authenticate('jwt', { session: false }), allCompanies);
router.get('/api/auth/getcompanybybin/:bin', passport.authenticate('jwt', { session: false }), companySearchByBin);
router.get('/api/auth/getcompanybyemail/:contactEmail', passport.authenticate('jwt', { session: false }), companySearchByContactEmail);
router.get('/api/auth/getcompanybyphone/:contactPhone', passport.authenticate('jwt', { session: false }), companySearchByContactPhone);
router.get('/api/auth/getcompanybyname/:name', passport.authenticate('jwt', { session: false }), companySearchByName);

// Профиль
router.get('/api/profile', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['name', 'lastname', 'phone', 'areasofactivity'],
    });

    if (!user) {
      return res.status(404).send({ message: 'Пользователь не найден' });
    }

    res.json(user);
  } catch (error) {
    console.error('Ошибка при получении профиля:', error);
    res.status(500).send({ message: 'Ошибка сервера' });
  }
});

router.put('/api/profile', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const { name, lastname, phone, areasofactivity } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    if (phone && phone !== user.phone) {
      const existingUser = await User.findOne({
        where: {
          phone,
          id: { [Op.ne]: req.user.id },
        },
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Такой номер телефона уже существует' });
      }
    }

    user.name = name || user.name;
    user.lastname = lastname || user.lastname;
    user.phone = phone || user.phone;
    user.areasofactivity = areasofactivity || user.areasofactivity;

    await user.save();

    res.status(200).json({ message: 'Профиль успешно обновлен' });
  } catch (error) {
    console.error('Ошибка при обновлении профиля:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Регистрация
router.post('/api/auth/signup', upload.single('company_logo'), validateSignUp, signUp);

// Экспорт отзывов
router.get('/api/export-reviews', passport.authenticate('jwt', { session: false }), isAdmin, exportReviewsToExcel);

module.exports = router;
