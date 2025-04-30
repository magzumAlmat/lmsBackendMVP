const passport = require('passport');
const passportJWT = require('passport-jwt');
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateJWT } = require('./utils/jwtutils');
require('dotenv').config(); // Подключаем dotenv для загрузки переменных из .env

const User = require('./models/User');

const GoogleStrategy = require('passport-google-oauth20').Strategy;
// Настройки для JWT
const jwtOptions = {
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'секретный_ключ',
};

passport.use(
  new JWTStrategy(jwtOptions, async (jwtPayload, done) => {
    try {
      const user = await User.findByPk(jwtPayload.id);
      if (user) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Пользователь не найден' });
      }
    } catch (error) {
      return done(error, false, { message: 'Ошибка при поиске пользователя' });
    }
  })
);

// Локальная стратегия для аутентификации по email и паролю
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email', // Поле для email
      passwordField: 'password', // Поле для пароля
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ where: { email } }); // Поиск пользователя по email

        if (!user) {
          return done(null, false, { message: 'Пользователь не найден' }); // Пользователь не найден
        }

        const isValidPassword = await bcrypt.compare(password, user.password); // Проверка пароля

        if (!isValidPassword) {
          return done(null, false, { message: 'Неверный пароль' }); // Пароль неверный
        }

        return done(null, user); // Успешная аутентификация
      } catch (error) {
        return done(error, false); // Ошибка при аутентификации
      }
    }
  )
);



// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: GOOGLE_CLIENT_ID,
//       clientSecret: GOOGLE_CLIENT_SECRET,
//       callbackURL: "http://localhost:4000/api/auth/google", // URL для перенаправления после авторизации
//       scope: ['openid', 'email', 'profile'], // Запрашиваемые данные
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         // Проверяем, существует ли пользователь с таким googleId
//         let user = await User.findOne({ where: { googleId: profile.id } });

//         if (!user) {
//           // Если пользователя нет, создаем нового
//           user = await User.create({
//             googleId: profile.id,
//             email: profile.emails[0].value,
//             name: profile.name.givenName,
//             lastname: profile.name.familyName,
//             roleId: 3, // Например, роль "пользователь"
//           });
//         }

//         return done(null, user); // Возвращаем найденного или созданного пользователя
//       } catch (error) {
//         return done(error, false, { message: 'Ошибка при обработке данных Google' });
//       }
//     }
//   )
// );
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: "http://localhost:4000/api/auth/google",
//       scope: ['openid', 'email', 'profile'],
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         // Проверяем, существует ли пользователь с таким googleId
//         let user = await User.findOne({ where: { googleId: profile.id } });
//         if (!user) {
//           // Если пользователя нет, создаем нового
//           user = await User.create({
//             googleId: profile.id,
//             email: profile.emails[0].value,
//             name: profile.name.givenName,
//             lastname: profile.name.familyName,
//             roleId: 3, // Например, роль "пользователь"
//           });
//         }

//         // Генерируем JWT
//         const token = generateJWT(user);

//         // Возвращаем токен и данные пользователя
//         return done(null, { user, token });
//       } catch (error) {
//         return done(error, false, { message: 'Ошибка при обработке данных Google' });
//       }
//     }
//   )
// );

// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: "http://localhost:4000/api/auth/google",
//       scope: ['openid', 'email', 'profile'],
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         let user = await User.findOne({ where: { googleId: profile.id } });
//         if (!user) {
//           user = await User.create({
//             googleId: profile.id,
//             email: profile.emails[0].value,
//             name: profile.name.givenName,
//             lastname: profile.name.familyName,
//             roleId: 3,
//           });
//         }
//         const token = generateJWT(user); // Генерируем JWT
//         return done(null, { user, token }); // Возвращаем токен и данные пользователя
//       } catch (error) {
//         return done(error, false, { message: 'Ошибка при обработке данных Google' });
//       }
//     }
//   )
// );

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`, // Убедитесь, что это совпадает с Google Cloud Console
      scope: ['openid', 'email', 'profile'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ where: { googleId: profile.id } });
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            // name: profile.name.givenName,
            // lastname: profile.name.familyName,
            // roleId: 3,
          });
        }
        const token = generateJWT(user); // Генерируем JWT
        
        return done(null, { user, token }); // Возвращаем пользователя и токен
      } catch (error) {
        return done(error, false, { message: 'Ошибка при обработке данных Google' });
      }
    }
  )
);
// passport.serializeUser((user, done) => {
//   console.log('User Serialize ', user);
//   done(null, user.id); // Сохраняем ID пользователя в сессии
// });

// passport.deserializeUser(async (id, done) => {
//   try {
//     const user = await User.findByPk(id); // Находим пользователя по ID
//     console.log('User Deserialized ', user);
//     done(null, user);
//   } catch (error) {
//     done(error, null);
//   }
// });


module.exports = {
  jwtOptions,
  passport,
};