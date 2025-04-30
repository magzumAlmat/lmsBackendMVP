const express=require('express')
const router=express.Router()
const {checkEmail,aUTH,verifyLink,sendVerificationEmail,verifyCode, signUp, logIn,createCompany,verifyCodeInspector,addFullProfile,allCompanies,
companySearchByBin,companySearchByContactPhone,companySearchByName,companySearchByContactEmail,getAuthentificatedUserInfo,updateUserRole,getAllUsers,forgotPassword,resetPassword,
exportReviewsToExcel}=require('./controllers')
const {validateSignUp,isAdmin,isStudent,isTeacher,authenticateJWT} = require('./middlewares')
const {upload} = require('./utils')
const passport = require('passport');
const User =require('../auth/models/User')
require('dotenv').config();
const { Op } = require("sequelize");
//авторизация------------------------------------------------------------------
router.get('/api/auth/check-email', checkEmail);

router.post('/api/register',aUTH )
router.post('/api/auth/login',logIn )
// router.post('/api/auth/sendmail',sendVerificationEmail )
router.post('/api/auth/verifycode',verifyCode )
router.get('/api/auth/verifylink/:id',verifyLink )

router.post('/api/forgot-password', forgotPassword);
router.post('/api/auth/reset-password', resetPassword);
router.get('/api/export-reviews', exportReviewsToExcel);
// Маршрут для начала аутентификации через Google
// router.get(
//   '/api/auth/google',
//   passport.authenticate('google', { scope: ['openid', 'email', 'profile'] })
// );

// // Маршрут для обработки ответа от Google
// router.get(
//   '/api/auth/google/callback',
//   passport.authenticate('google', { failureRedirect: '/login' }),
//   (req, res) => {
//     // Генерация JWT или перенаправление пользователя
//     const token = generateJWT(req.user); // Функция для генерации JWT
//     res.redirect(`http://localhost:3000/layout?token=${token}`);
//   }
// );
router.get(
  '/api/auth/google',
  passport.authenticate('google', { scope: ['openid', 'email', 'profile'] })
);

// Маршрут для обработки обратного вызова от Google
router.get(
  '/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    const { user, token } = req.user;
    res.redirect(`${process.env.FRONTEND_URL}/layout?token=${token}`);
  }
);
// Маршрут для обработки ответа от Google


//----------------------------------------------------------------------------
router.put('/api/users/:userId/role',passport.authenticate('jwt', {session: false}),isAdmin,updateUserRole )
router.post('/api/auth/addfullprofile',passport.authenticate('jwt', {session: false}), addFullProfile)




router.get('/api/getallusers',passport.authenticate('jwt', {session: false}),getAllUsers)

router.get('/api/auth/getAuthentificatedUserInfo',passport.authenticate('jwt', {session: false}),getAuthentificatedUserInfo)
router.post('/api/auth/inspector/verifycode',passport.authenticate('jwt', {session: false}),verifyCodeInspector )
// router.post('/api/auth/signup', upload.single'company_logo'), validateSignUp, signUp)
router.post('/api/auth/createcompany',  passport.authenticate('jwt', {session: false}),createCompany)
// router.get('/api/banner/getbyuniquecode/:uniqueCode', passport.authenticate('jwt', {session: false}),getBannerByuniqueCode)
router.get('/api/auth/getallcompanies/',  passport.authenticate('jwt', {session: false}),allCompanies)
router.get('/api/auth/getcompanybybin/:bin',  passport.authenticate('jwt', {session: false}),companySearchByBin)
router.get('/api/auth/getcompanybyemail/:contactEmail',  passport.authenticate('jwt', {session: false}),companySearchByContactEmail)
router.get('/api/auth/getcompanybyphone/:contactPhone',  passport.authenticate('jwt', {session: false}),companySearchByContactPhone)
router.get('/api/auth/getcompanybyname/:name',  passport.authenticate('jwt', {session: false}),companySearchByName)



router.get("/api/profile", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: ["name", "lastname", "phone","areasofactivity"], // Выбираем только нужные поля
      });
  
      if (!user) {
        return res.status(404).send({ message: "Пользователь не найден" });
      }
  
      res.json(user);
    } catch (error) {
      console.error("Ошибка при получении профиля:", error);
      res.status(500).send({ message: "Ошибка сервера" });
    }
  });
  
  // Обновление данных профиля
  // router.put("/api/profile", passport.authenticate("jwt", { session: false }), async (req, res) => {
  //   try {
  //     const { name, lastname, phone,areasofactivity } = req.body;
  
  //     const user = await User.findByPk(req.user.id);
  
  //     if (!user) {
  //       return res.status(404).send({ message: "Пользователь не найден" });
  //     }
  
  //     // Обновляем данные пользователя
  //     user.name = name;
  //     user.lastname = lastname;
  //     user.phone = phone;
  //     user.areasofactivity=areasofactivity;
  
  //     await user.save();
  
  //     res.json({ message: "Профиль успешно обновлен" });
  //   } catch (error) {
  //     console.error("Ошибка при обновлении профиля:", error);
  //     res.status(500).send({ message: "Ошибка сервера" });
  //   }
  // });

  
router.put("/api/profile", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const { name, lastname, phone, areasofactivity } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    // Проверка уникальности номера телефона
    if (phone && phone !== user.phone) { // Проверяем только если телефон изменился
      const existingUser = await User.findOne({
        where: {
          phone,
          id: { [Op.ne]: req.user.id }, // Исключаем текущего пользователя
        },
      });
      if (existingUser) {
        return res.status(400).json({ message: "Такой номер телефона уже существует" });
      }
    }

    // Обновляем данные пользователя, только если они переданы
    user.name = name || user.name;
    user.lastname = lastname || user.lastname;
    user.phone = phone || user.phone;
    user.areasofactivity = areasofactivity || user.areasofactivity;

    await user.save();

    res.status(200).json({ message: "Профиль успешно обновлен" });
  } catch (error) {
    console.error("Ошибка при обновлении профиля:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});


router.post('/api/auth/login', logIn)
module.exports=router