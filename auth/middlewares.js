// const Role = require('./models/Role')
// const User = require('./models/User')



// const authenticateJWT = (req, res, next) => {
//     const authHeader = req.headers.authorization;
  
//     if (authHeader) {
//       const token = authHeader.split(' ')[1]; // Bearer <token>
  
//       jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//         if (err) {
//           return res.sendStatus(403); // Forbidden
//         }
  
//         req.user = user; // Добавляем данные пользователя в запрос
//         next();
//       });
//     } else {
//       res.sendStatus(401); // Unauthorized
//     }
//   };
  
// const isTeacher = async (req, res, next) => {
//     console.log('isTeacher started     req.user= ',req.user)
//     try {
//         if(req.user){
//             const role = await Role.findByPk(req.user.roleId)
//             console.log('ROLE= ',role.name)
//             if(role.name === "teacher") next()
//             else res.status(403).send({message: "Access denied"})
//         }
//         else res.status(403).send({message: "Unauthorized"})
//     } catch (error) {
//         res.status(500).send(error)
//     }
// }

// const isStudent = async (req, res, next) => {
//     console.log('isManager Started')
//     try {
//         if(req.user){
//             const role = await Role.findByPk(req.user.roleId)

//             if(role.name === "student") next()
//             else res.status(403).send({message: "Access denied"})
//         }
//         else res.status(403).send({message: "Unauthorized"})
//     } catch (error) {
//         res.status(500).send(error)
//     }
// }

// const isAdmin = async (req, res, next) => {
//     console.log('isAdmin Started')
//     try {
//         if(req.user){
//             const role = await Role.findByPk(req.user.roleId)

//             if(role.name === "admin") next()
//             else res.status(403).send({message: "Access denied"})
//         }
//         else res.status(403).send({message: "Unauthorized"})
//     } catch (error) {
//         res.status(500).send(error)
//     }
// }
// const validateSignUp = async (req, res, next) =>{
//     try {
//         let errors = {}

//         if(!req.body.email || req.body.email.length === 0){
//             errors.email = "Поле Email не заполнено"
//         }
//         if(!req.body.full_name || req.body.full_name.length === 0){
//             errors.full_name = "Поле Имя и Фамилия не заполнено"
//         }
//         if(!req.body.company_name || req.body.company_name.length === 0){
//             errors.company_name = "Поле Название компании не заполнено"
//         }
//         if(!req.body.password || req.body.password.length === 0){
//             errors.password = "Поле Пароль не заполнено"
//         }
//         if(!req.body.password2 || req.body.password2.length === 0){
//             errors.password2 = "Поле Подтверждение пароля не заполнено"
//         }

//         if(req.body.password !== req.body.password2){
//             errors.password2 = "Пароли не совпадают"
//         }
//         const user = await User.findOne({
//             where: {
//                 email: req.body.email
//             }
//         })

//         if(user) {
//             errors.email = "Пользователь с таким Email уже зарегистрирован"
//         }

//         if(JSON.stringify(errors) !== JSON.stringify({}))
//         res.status(400).send(errors)
//         else next()
//     } catch (error) {
//         res.status(500).send(error)
//     }
// }

// module.exports = {
//     isAdmin,
//     isStudent,
//     isTeacher,
//     validateSignUp,authenticateJWT
// }




const Role = require('./models/Role');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: 'Токен не предоставлен' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Проверяем актуальность токена в базе
    const user = await User.findByPk(payload.id);
    if (!user || !user.jwt_token) {
      console.log('No user or jwt_token found for userId:', payload.id);
      return res.status(403).send({ message: 'Сессия недействительна' });
    }

    // Проверяем, что токен совпадает с сохранённым
    if (user.jwt_token !== token) {
      console.log('Token mismatch: Provided token does not match stored token');
      return res.status(403).send({ message: 'Токен устарел или недействителен' });
    }

    const deviceId = req.headers['user-agent']
      ? crypto.createHash('md5').update(req.headers['user-agent']).digest('hex')
      : crypto.randomBytes(16).toString('hex');
    console.log('Checking deviceId:', deviceId, 'Payload devices:', payload.devices);

    if (!payload.devices || !payload.devices.includes(deviceId)) {
      console.log('Device not authorized: deviceId=', deviceId, 'Allowed devices=', payload.devices);
      return res.status(403).send({ message: 'Устройство не авторизовано' });
    }

    req.user = payload;
    next();
  } catch (err) {
    console.error('JWT verification error:', err);
    return res.status(403).send({ message: 'Недействительный токен' });
  }
};

const authenticateJWTForLogout = async (req, res, next) => {
    const authHeader = req.headers.authorization;
  
    if (!authHeader) {
      return res.status(401).send({ message: 'Токен не предоставлен' });
    }
  
    const token = authHeader.split(' ')[1];
  
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(payload.id);
      if (!user) {
        return res.status(404).send({ message: 'Пользователь не найден' });
      }
  
      req.user = payload;
      next();
      console.log('middleware СРАБОТАЛ')
    } catch (err) {
      console.error('JWT verification error:', err);
      return res.status(403).send({ message: 'Недействительный токен' });
    }
  };
//   const isAdmin = async (req, res, next) => {
//     console.log('isAdmin Started',req.user);
//     console.log('USER ADMIN= ',req.user.roleId)
//     try {
//       if (req.user) {
//         const role = await Role.findByPk(req.user.role.id); // Используем req.user.role.id
        

//         if (req.user.roleId == 1) next();
//         else res.status(403).send({ message: 'Access denied' });
//       } else res.status(403).send({ message: 'Unauthorized' });
//     } catch (error) {
//       res.status(500).send(error);
//     }
//   };
  
const isAdmin = async (req, res, next) => {
    try {
      const user = await User.findByPk(req.user.id, {
        include: [{ model: Role }],
      });
      if (!user || user.Role.name !== 'admin') {
        return res.status(403).json({ message: 'Доступ запрещён: требуется роль администратора' });
      }
      next();
    } catch (error) {
      console.error('Ошибка в isAdmin:', error);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
  };


  
  const isTeacher = async (req, res, next) => {
    console.log('isTeacher started     req.user=', req.user);
    try {
      if (req.user) {
        const role = await Role.findByPk(req.user.role.id);
        if (role.name === 'teacher') next();
        else res.status(403).send({ message: 'Access denied' });
      } else res.status(403).send({ message: 'Unauthorized' });
    } catch (error) {
      res.status(500).send(error);
    }
  };
  
  const isStudent = async (req, res, next) => {
    console.log('isStudent Started');
    try {
      if (req.user) {
        const role = await Role.findByPk(req.user.role.id);
        if (role.name === 'student') next();
        else res.status(403).send({ message: 'Access denied' });
      } else res.status(403).send({ message: 'Unauthorized' });
    } catch (error) {
      res.status(500).send(error);
    }
  };

const validateSignUp = async (req, res, next) => {
  try {
    let errors = {};

    if (!req.body.email || req.body.email.length === 0) {
      errors.email = 'Поле Email не заполнено';
    }
    if (!req.body.full_name || req.body.full_name.length === 0) {
      errors.full_name = 'Поле Имя и Фамилия не заполнено';
    }
    if (!req.body.company_name || req.body.company_name.length === 0) {
      errors.company_name = 'Поле Название компании не заполнено';
    }
    if (!req.body.password || req.body.password.length === 0) {
      errors.password = 'Поле Пароль не заполнено';
    }
    if (!req.body.password2 || req.body.password2.length === 0) {
      errors.password2 = 'Поле Подтверждение пароля не заполнено';
    }

    if (req.body.password !== req.body.password2) {
      errors.password2 = 'Пароли не совпадают';
    }
    const user = await User.findOne({
      where: {
        email: req.body.email,
      },
    });

    if (user) {
      errors.email = 'Пользователь с таким Email уже зарегистрирован';
    }

    if (JSON.stringify(errors) !== JSON.stringify({})) res.status(400).send(errors);
    else next();
  } catch (error) {
    res.status(500).send(error);
  }
};

module.exports = {
  isAdmin,
  isStudent,
  isTeacher,
  validateSignUp,
  authenticateJWT,authenticateJWTForLogout
};
