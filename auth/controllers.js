
const { Op } = require('sequelize');
const AuthCode = require('./models/AuthCode');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Role = require('./models/Role');
const { jwtOptions, passport } = require('./passport');
const Company = require('./models/Company');
const sendEmail = require('./utils/sendMail');
const PasswordResetToken = require('./models/PasswordResetToken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const ExcelJS = require('exceljs');
const UserDevices=require('../models/UserDevices')
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Запрос на сброс пароля
const forgotPassword = async (req, res) => {
  console.log('ForgotPassword started!');
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'Пользователь с таким email не найден' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000);

    await PasswordResetToken.create({
      userId: user.id,
      token,
      expiresAt,
    });

    const resetLink = `https://lms.kazniisa.kz/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Сброс пароля',
      text: `Для сброса пароля перейдите по ссылке: ${resetLink}. Ссылка действительна 1 час.`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Письмо для сброса пароля отправлено' });
  } catch (error) {
    console.error('Ошибка при запросе сброса пароля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Сброс пароля
const resetPassword = async (req, res) => {
  console.log('1 resetPassword started ', req.body);
  const { token, newPassword } = req.body;

  try {
    const resetToken = await PasswordResetToken.findOne({
      where: { token },
      include: [{ model: User, as: 'User' }],
    });
    console.log('2 resetToken=', resetToken);

    if (!resetToken) {
      console.log('Token not found');
      return res.status(400).json({ error: 'Токен недействителен или истек' });
    }

    console.log('3 expiresAt=', resetToken.expiresAt, 'now=', new Date());
    if (resetToken.expiresAt < new Date()) {
      console.log('Token expired');
      return res.status(400).json({ error: 'Токен недействителен или истек' });
    }

    const user = resetToken.User;
    console.log('4 user before save=', user);
    user.password = newPassword;
    await user.save();
    console.log('5 user after save=', user);

    await resetToken.destroy();
    res.status(200).json({ message: 'Пароль успешно изменен' });
  } catch (error) {
    console.error('Ошибка при сбросе пароля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Хеширование пароля перед обновлением
User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    console.log('Password changed, hashing...');
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    console.log('Password hashed');
  }
});

// const getAllUsers = async (req, res) => {
//   console.log('getAllUsers started!');
//   try {
//     const users = await User.findAll({
//       attributes: ['id', 'email', 'name', 'lastname', 'phone', 'roleId', 'areasofactivity'],
//       include: [
//         {
//           model: Role,
//           attributes: ['id', 'name'],
//         },
//       ],
//     });

//     if (!users || users.length === 0) {
//       return res.status(404).json({ message: 'Пользователи не найдены' });
//     }

    
//     return res.status(200).json({
//       message: 'Список пользователей успешно получен',
//       users,
//     });

//   } catch (error) {
//     console.error('Ошибка при получении пользователей:', error);
//     return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
//   }
// };

const getAllUsers = async (req, res) => {
  console.log('getAllUsers started!');
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'name', 'lastname', 'phone', 'roleId', 'areasofactivity'],
      include: [
        {
          model: Role,
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'Пользователи не найдены' });
    }

    return res.status(200).json({
      message: 'Список пользователей успешно получен',
      users,
    });
  } catch (error) {
    console.error('Ошибка при получении пользователей:', error);
    return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
};

const updateUserRole = async (req, res) => {
  console.log('1 я внутри updateUserRole');
  try {
    const { userId } = req.params;
    const { roleId } = req.body;

    console.log('2 userId= ', userId, ' roleId= ', roleId);
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    console.log('3 user= ', user);
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Роль не найдена' });
    }

    console.log('4 role= ', role);
    user.roleId = roleId;
    await user.save();

    return res.status(200).json({
      message: 'Роль пользователя успешно обновлена',
      user: {
        id: user.id,
        email: user.email,
        roleId: user.roleId,
      },
    });
  } catch (error) {
    console.error('Ошибка при обновлении роли пользователя:', error);
    return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
};

const getAuthenticatedUserInfo = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Токен отсутствует' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded); // Логируем токен
    } catch (err) {
      console.error('Token verification failed:', err.message);
      return res.status(401).json({ error: 'Недействительный токен' });
    }

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'jwt_token'] },
      include: [{ model: Role, attributes: ['id', 'name'] }],
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    console.log('Authenticated user:', user.email, 'Role:', user.Role.name);
    res.status(200).json(user);
  } catch (error) {
    console.error('Ошибка в getAuthenticatedUserInfo:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const createCompany = async (req, res) => {
  try {
    const { name, bin, description, address, contactPhone, contactEmail, isUR } = req.body;
    console.log('phone', req.body.contactPhone, 'email', req.body.contactEmail, 'isUR', isUR);

    const existingCompany = await Company.findOne({
      where: {
        [Op.or]: [{ name }, { bin }, { contactEmail }, { contactPhone }],
      },
    });

    if (existingCompany) {
      return res.status(400).json({ message: 'Company with the same name, bin, or contactEmail already exists' });
    }

    const Comp = await Company.create({
      isUR,
      name,
      description,
      bin,
      address,
      contactPhone,
      contactEmail,
    });

    res.status(201).json(Comp);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не удалось создать запись в базе данных' });
  }
};

const companySearchByName = async (req, res) => {
  const { name } = req.params;
  console.log('name==', name);
  try {
    const companies = await Company.findAll({
      where: {
        name: {
          [Op.iLike]: `%${name}%`,
        },
      },
    });

    res.json(companies);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to search by name' });
  }
};

const allCompanies = async (req, res) => {
  try {
    const companies = await Company.findAll();
    res.json(companies);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to search by name' });
  }
};

const companySearchByBin = async (req, res) => {
  const { bin } = req.params;

  console.log('thisis bin', req.params.bin);
  try {
    const companies = await Company.findAll({
      where: {
        bin: {
          [Op.iLike]: `%${bin}%`,
        },
      },
    });

    res.status(200).send(companies);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to search by bin' });
  }
};

const companySearchByContactPhone = async (req, res) => {
  const { contactPhone } = req.params;

  try {
    const companies = await Company.findAll({
      where: {
        contactPhone: {
          [Op.iLike]: `%${contactPhone}%`,
        },
      },
    });

    res.json(companies);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to search by contact phone' });
  }
};

const companySearchByContactEmail = async (req, res) => {
  const { contactEmail } = req.params;

  try {
    const companies = await Company.findAll({
      where: {
        contactEmail: {
          [Op.iLike]: `%${contactEmail}%`,
        },
      },
    });

    res.json(companies);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to search by contact email' });
  }
};

const checkEmail = async (req, res) => {
  const { email } = req.query;

  try {
    const user = await User.findOne({ where: { email } });
    res.json({ exists: !!user });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при проверке email' });
  }
};

const aUTH = async (req, res) => {
  const { email, password, phone, name, lastname, roleId } = req.body;
  console.log('roleId= ', roleId);
  try {
    const user = await User.create({ email, password, phone, name, lastname });

    const deviceId = req.headers['user-agent']
    ? crypto.createHash('sha256').update(req.headers['user-agent']).digest('hex')
    : crypto.randomBytes(16).toString('hex');
    const role = await Role.findByPk(roleId);
    const payload = {
      id: user.id,
      email: user.email,
      role: { id: role.id, name: role.name },
      devices: [deviceId],
      savedDevices: [deviceId],
    };
    const token = jwt.sign(payload, jwtOptions.secretOrKey, { expiresIn: '1h' });
    await user.update({ jwt_token: token });


    const verificationLink = `${process.env.VERIFY_URL}/api/auth/verifylink/${user.id}`;
    await sendEmail(
      user.email,
      'Подтверждение регистрации',
      `<div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #1976d2;">Подтверждение регистрации</h2>
      <p>Спасибо за регистрацию! Для подтверждения вашего email перейдите по ссылке ниже:</p>
      <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 5px;">Подтвердить email</a>
      <p style="color: #555;">Если вы не регистрировались, проигнорируйте это письмо.</p>
    </div>`
    );

    res.status(201).json({ message: 'Пользователь зарегистрирован. Проверьте email для подтверждения.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const sendVerificationEmail = (req, res) => {
  console.log('req.body', req.body);
  let fullcode = Math.floor(1000 + Math.random() * 9000).toString().slice(0, 4);

  const code = 'Ваш код авторизации:        ' + fullcode;

  AuthCode.create({
    email: req.body.email,
    code: fullcode,
    valid_till: Date.now() + 300000,
  });

  sendEmail(req.body.email, 'Код авторизации для lms', code);
  res.status(200).send(code);
};

const verifyLink = async (req, res) => {
  console.log('Im in VerifyLink');
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    await user.save();
    console.log('User= ', user);

    res.redirect(`${process.env.VERIFY_URL}/login?verified=success`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// const logIn = async (req, res) => {
//   console.log('IAM IN LOGIN controller');
//   passport.authenticate('local', { session: false }, async (err, user, info) => {
//     if (err || !user) {
//       return res.status(401).json({ message: 'Ошибка аутентификации', info });
//     }

//     try {
//       const deviceId = req.headers['user-agent']
//         ? crypto.createHash('md5').update(req.headers['user-agent']).digest('hex')
//         : crypto.randomBytes(16).toString('hex');
//       console.log('Generated deviceId:', deviceId, 'User-Agent:', req.headers['user-agent']);

//       let devices = [];
//       if (user.jwt_token) {
//         try {
//           const decoded = jwt.verify(user.jwt_token, jwtOptions.secretOrKey);
//           devices = decoded.devices || [];
//           console.log('Existing devices from token:', devices);
//         } catch (e) {
//           console.error('Invalid stored token:', e);
//           devices = [];
//         }
//       }

//       console.log('Devices before check:', devices, 'Length:', devices.length);
//       if (devices.length < 2 && !devices.includes(deviceId)) {
//         devices.push(deviceId);
//         console.log('New device added:', deviceId);
//       } else if (!devices.includes(deviceId)) {
//         console.log('Login rejected: Maximum 2 devices allowed. Current devices:', devices);
//         return res.status(403).json({ message: 'Достигнуто максимальное количество устройств (2). Выйдите с одного из устройств.' });
//       }

//       // Дополнительная проверка: не более 2 устройств
//       if (devices.length > 2) {
//         console.error('Error: More than 2 devices detected:', devices);
//         return res.status(403).json({ message: 'Обнаружено более 2 устройств. Пожалуйста, выйдите с лишних устройств.' });
//       }

//       console.log('Updated devices:', devices);

//       if (!user.roleId) {
//         console.error('User roleId is null for user:', user.id, 'email:', user.email);
//         return res.status(400).json({ message: 'У пользователя отсутствует роль. Обратитесь к администратору.' });
//       }

//       const role = await Role.findByPk(user.roleId);
//       if (!role) {
//         console.error('Role not found for roleId:', user.roleId, 'user:', user.id);
//         return res.status(400).json({ message: 'Роль пользователя не найдена в базе данных.' });
//       }

//       const payload = {
//         id: user.id,
//         email: user.email,
//         role: {
//           id: role.id,
//           name: role.name,
//         },
//         devices,
//       };
//       const token = jwt.sign(payload, jwtOptions.secretOrKey, { expiresIn: '1h' });

//       await user.update({ jwt_token: token });
//       console.log('New JWT token saved for user:', user.id, 'Devices in token:', devices);

//       return res.status(200).json({ message: 'Успешный вход', token });
//     } catch (error) {
//       console.error('Ошибка при создании токена:', error);
//       return res.status(500).json({ message: 'Ошибка сервера' });
//     }
//   })(req, res);
// };

// const logOut = async (req, res) => {
//   console.log('Logout сработал')
//   try {
//     const user = await User.findByPk(req.user.id);
//     if (!user) {
//       return res.status(404).json({ message: 'Пользователь не найден' });
//     }

//     const deviceId = req.headers['user-agent']
//       ? crypto.createHash('md5').update(req.headers['user-agent']).digest('hex')
//       : crypto.randomBytes(16).toString('hex');
//     console.log('Logout deviceId:', deviceId, 'User-Agent:', req.headers['user-agent']);

//     let devices = req.user.devices || [];
//     console.log('Devices before logout:', devices);

//     devices = devices.filter((id) => id !== deviceId);
//     console.log('Devices after logout:', devices);

//     if (devices.length === 0) {
//       console.log('All devices removed, setting jwt_token to null for user:', user.id);
//       try {
//         await user.update({ jwt_token: null });
//       } catch (updateError) {
//         console.error('Failed to update jwt_token to null:', updateError);
//         return res.status(500).json({ message: 'Ошибка при обновлении сессии' });
//       }
//     } else {
//       const role = await Role.findByPk(user.roleId);
//       const newPayload = {
//         id: user.id,
//         email: user.email,
//         role: { id: role.id, name: role.name },
//         devices,
//       };
//       const newToken = jwt.sign(newPayload, jwtOptions.secretOrKey, { expiresIn: '1h' });
//       console.log('Updating jwt_token with new token for user:', user.id, 'New devices:', devices);
//       try {
//         await user.update({ jwt_token: newToken });
//         console.log('New token saved:', newToken);
//       } catch (updateError) {
//         console.error('Failed to update jwt_token:', updateError);
//         return res.status(500).json({ message: 'Ошибка при обновлении сессии' });
//       }
//     }

//     res.status(200).json({ message: 'Сессия завершена' });
//     console.log('Вышел юзер');
//   } catch (error) {
//     console.error('Ошибка при логауте:', error);
//     res.status(500).json({ message: 'Ошибка сервера' });
//   }
// };


const normalizeUserAgent = (userAgent) => {
  if (!userAgent) return 'Unknown User-Agent';
  
  let normalized = userAgent
    .replace(/Chrome\/[\d.]+/, 'Chrome')
    .replace(/Firefox\/[\d.]+/, 'Firefox')
    .replace(/Safari\/[\d.]+/, 'Safari')
    .replace(/Edge\/[\d.]+/, 'Edge')
    .replace(/AppleWebKit\/[\d.]+/, 'AppleWebKit')
    .replace(/Gecko\/[\d.]+/, 'Gecko')
    .replace(/\s+/g, ' ')
    .trim();
  
  return normalized;
};

const logIn = async (req, res) => {
  console.log('IAM IN LOGIN controller');

  passport.authenticate('local', { session: false }, async (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({ message: 'Ошибка аутентификации', info });
    }

    try {
      const rawUserAgent = req.headers['user-agent'] || 'Unknown User-Agent';
      const normalizedUserAgent = normalizeUserAgent(rawUserAgent);
      console.log('Raw User-Agent:', rawUserAgent);
      console.log('Normalized User-Agent:', normalizedUserAgent);

      const deviceId = crypto
        .createHash('sha256')
        .update(normalizedUserAgent)
        .digest('hex');
      console.log('Generated deviceId:', deviceId);

      // Query UserDevices table
      const userDevices = await UserDevices.findAll({ where: { userId: user.id } });
      let savedDevices = userDevices.map((device) => device.deviceId);
      console.log('SavedDevices from UserDevices:', savedDevices);

      if (!savedDevices.includes(deviceId)) {
        if (savedDevices.length < 2) {
          await UserDevices.create({ userId: user.id, deviceId });
          savedDevices.push(deviceId);
          console.log('Новое устройство добавлено в UserDevices:', deviceId);
        } else {
          console.log('Вход отклонен: Достигнут лимит в 2 устройства:', savedDevices);
          return res.status(403).json({
            message: 'Достигнуто максимальное количество устройств (2). Выйдите с одного из устройств или обратитесь к администратору.',
            deviceId,
          });
        }
      } else {
        console.log('Устройство уже в UserDevices, вход разрешен:', deviceId);
      }

      if (!user.roleId) {
        console.error('У пользователя отсутствует roleId:', user.id, 'email:', user.email);
        return res.status(400).json({ message: 'У пользователя отсутствует роль. Обратитесь к администратору.' });
      }

      const role = await Role.findByPk(user.roleId);
      if (!role) {
        console.error('Роль не найдена для roleId:', user.roleId, 'user:', user.id);
        return res.status(400).json({ message: 'Роль пользователя не найдена в базе данных.' });
      }

      const payload = {
        id: user.id,
        email: user.email,
        role: {
          id: role.id,
          name: role.name,
        },
      };

      const token = jwt.sign(payload, jwtOptions.secretOrKey, { expiresIn: '1h' });

      await user.update({ jwt_token: token });
      console.log('Новый JWT токен сохранен для пользователя:', user.id);

      return res.status(200).json({
        message: 'Успешный вход',
        token,
        deviceId,
      });
    } catch (error) {
      console.error('Ошибка при создании токена:', error);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
  })(req, res);
};




const logOut = async (req, res) => {
  console.log('Логаут начался');

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const rawUserAgent = req.headers['user-agent'] || 'Unknown User-Agent';
    const normalizedUserAgent = normalizeUserAgent(rawUserAgent);
    console.log('Raw User-Agent:', rawUserAgent);
    console.log('Normalized User-Agent:', normalizedUserAgent);

    const deviceId = crypto
      .createHash('sha256')
      .update(normalizedUserAgent)
      .digest('hex');
    console.log('DeviceId для логаута:', deviceId);

    // Fetch current devices
    const userDevices = await UserDevices.findAll({ where: { userId: user.id } });
    const savedDevices = userDevices.map((device) => device.deviceId);
    console.log('SavedDevices до логаута:', savedDevices);

    // Remove the current device from UserDevices
    if (savedDevices.includes(deviceId)) {
      await UserDevices.destroy({
        where: { userId: user.id, deviceId },
      });
      console.log('Устройство удалено из UserDevices:', deviceId);
    } else {
      console.log('Устройство не найдено в UserDevices:', deviceId);
    }

    // Fetch updated devices after removal
    const updatedDevices = await UserDevices.findAll({ where: { userId: user.id } });
    const updatedSavedDevices = updatedDevices.map((device) => device.deviceId);
    console.log('SavedDevices после логаута:', updatedSavedDevices);

    const role = await Role.findByPk(user.roleId);
    if (!role) {
      return res.status(400).json({ message: 'Роль пользователя не найдена' });
    }

    // Generate new JWT token with updated devices
    const newPayload = {
      id: user.id,
      email: user.email,
      role: { id: role.id, name: role.name },
      devices: updatedSavedDevices, // Include updated device list
    };

    const newToken = jwt.sign(newPayload, jwtOptions.secretOrKey, { expiresIn: '1h' });
    console.log('Обновляем jwt_token новым токеном для пользователя:', user.id);

    await user.update({ jwt_token: newToken });

    res.status(200).json({ message: 'Сессия завершена' });
    console.log('Пользователь успешно вышел');
  } catch (error) {
    console.error('Ошибка при логауте:', error);
    return res.status(500).json({ message: 'Ошибка сервера при выходе' });
  }
};


const manageDevices = async (req, res) => {
  try {
    const { userId, deviceId, action } = req.body; // action: 'add' or 'remove'
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    let devices = [];
    let savedDevices = [];
    if (user.jwt_token) {
      const decoded = jwt.verify(user.jwt_token, jwtOptions.secretOrKey);
      devices = decoded.devices || [];
      savedDevices = decoded.savedDevices || [];
    }

    if (action === 'add') {
      if (savedDevices.includes(deviceId)) {
        return res.status(400).json({ message: 'Устройство уже зарегистрировано' });
      }
      if (savedDevices.length >= 2) {
        return res.status(403).json({ message: 'Достигнут лимит в 2 устройства' });
      }
      savedDevices.push(deviceId);
    } else if (action === 'remove') {
      savedDevices = savedDevices.filter((id) => id !== deviceId);
    }

    devices = [...savedDevices]; // Синхронизируем
    const role = await Role.findByPk(user.roleId);
    const payload = {
      id: user.id,
      email: user.email,
      role: { id: role.id, name: role.name },
      devices,
      savedDevices,
    };
    const newToken = jwt.sign(payload, jwtOptions.secretOrKey, { expiresIn: '1h' });
    await user.update({ jwt_token: newToken });

    res.status(200).json({ message: `Устройство ${action === 'add' ? 'добавлено' : 'удалено'}` });
  } catch (error) {
    console.error('Ошибка управления устройством:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};


// const logOut = async (req, res) => {
//   console.log('Logout started');
//   try {
//     const user = await User.findByPk(req.user.id);
//     if (!user) {
//       return res.status(404).json({ message: 'Пользователь не найден' });
//     }

//     const deviceId = req.headers['user-agent']
//       ? crypto.createHash('md5').update(req.headers['user-agent']).digest('hex')
//       : crypto.randomBytes(16).toString('hex');
//     console.log('Logout deviceId:', deviceId, 'User-Agent:', req.headers['user-agent']);

//     let devices = req.user.devices || [];
//     console.log('Devices before logout:', devices);

//     devices = devices.filter((id) => id !== deviceId);
//     console.log('Devices after logout:', devices);

//     if (devices.length === 0) {
//       console.log('All devices removed, setting jwt_token to null for user:', user.id);
//       await user.update({ jwt_token: null });
//     } else {
//       const role = await Role.findByPk(user.roleId);
//       if (!role) {
//         return res.status(400).json({ message: 'Роль пользователя не найдена' });
//       }
//       const newPayload = {
//         id: user.id,
//         email: user.email,
//         role: { id: role.id, name: role.name },
//         devices,
//       };
//       const newToken = jwt.sign(newPayload, jwtOptions.secretOrKey, { expiresIn: '1h' });
//       console.log('Updating jwt_token with new token for user:', user.id, 'New devices:', devices);
//       await user.update({ jwt_token: newToken });
//     }

//     res.status(200).json({ message: 'Сессия завершена' });
//     console.log('User logged out successfully');
//   } catch (error) {
//     console.error('Ошибка при логауте:', error);
//     res.status(500).json({ message: 'Ошибка сервера при выходе' });
//   }
// };



const verifyCode = async (req, res) => {
  const authCode = await AuthCode.findOne({
    where: { email: req.body.email },
    order: [['valid_till', 'DESC']],
  });
  if (!authCode) {
    res.status(401).send({ error: 'EMAIL NOT FOUND' });
  } else if (new Date(authCode.valid_till).getTime() < Date.now()) {
    res.status(401).send({ error: 'время прошло' });
  } else if (authCode.code !== req.body.code) {
    res.status(401).send({ error: 'код не совпадает' });
  } else {
    console.log(4);
    const role = await Role.findOne({ where: { name: 'teacher' } });
    let user = await User.findOne({ where: { email: req.body.email } });

    if (!role) {
      res.status(401).send({ error: "Role 'teacher' not found" });
    } else {
      if (!user) {
        console.log('User не найден - щас создадим', 'rode.id= ', role.id);
        user = await User.create({
          roleId: role.id,
          email: req.body.email,
        });
      }

      const deviceId = req.headers['user-agent']
        ? crypto.createHash('md5').update(req.headers['user-agent']).digest('hex')
        : crypto.randomBytes(16).toString('hex');
      console.log('Generated deviceId:', deviceId, 'User-Agent:', req.headers['user-agent']);

      let devices = [];
      if (user.jwt_token) {
        try {
          const decoded = jwt.verify(user.jwt_token, jwtOptions.secretOrKey);
          devices = decoded.devices || [];
          console.log('Existing devices:', devices);
        } catch (e) {
          console.error('Invalid stored token:', e);
          devices = [];
        }
      }

      if (devices.length < 2 && !devices.includes(deviceId)) {
        devices.push(deviceId);
        console.log('New device added:', deviceId);
      } else if (!devices.includes(deviceId)) {
        console.log('Login rejected: Maximum 2 devices allowed. Current devices:', devices);
        return res.status(403).json({ message: 'Достигнуто максимальное количество устройств (2). Выйдите с одного из устройств.' });
      }

      console.log('Updated devices:', devices);

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          phone: user.phone,
          name: user.name,
          lastname: user.lastname,
          companyId: user.companyId,
          role: {
            id: role.id,
            name: role.name,
          },
          devices,
        },
        jwtOptions.secretOrKey,
        {
          expiresIn: 24 * 60 * 60 * 365,
        }
      );

      await user.update({ jwt_token: token });
      console.log('New JWT token saved for user:', user.id, 'Devices in token:', devices);
      res.status(200).send({ token });
    }
  }
};

const verifyCodeInspector = async (req, res) => {
  const authCode = await AuthCode.findOne({
    where: { email: req.body.email },
    order: [['valid_till', 'DESC']],
  });
  if (!authCode) {
    res.status(401).send({ error: 'EMAIL NOT FOUND' });
  } else if (new Date(authCode.valid_till).getTime() < Date.now()) {
    res.status(401).send({ error: 'время прошло' });
  } else if (authCode.code !== req.body.code) {
    res.status(401).send({ error: 'код не совпадает' });
  } else {
    console.log(4);
    const role = await Role.findOne({ where: { name: 'inspector' } });
    let user = await User.findOne({ where: { email: req.body.email } });

    if (!role) {
      res.status(401).send({ error: "Role 'inspector' not found" });
    } else {
      if (!user) {
        user = await User.create({
          roleId: role.id,
          email: req.body.email,
        });
      }

      const deviceId = req.headers['user-agent']
        ? crypto.createHash('md5').update(req.headers['user-agent']).digest('hex')
        : crypto.randomBytes(16).toString('hex');
      console.log('Generated deviceId:', deviceId, 'User-Agent:', req.headers['user-agent']);

      let devices = [];
      if (user.jwt_token) {
        try {
          const decoded = jwt.verify(user.jwt_token, jwtOptions.secretOrKey);
          devices = decoded.devices || [];
          console.log('Existing devices:', devices);
        } catch (e) {
          console.error('Invalid stored token:', e);
          devices = [];
        }
      }

      if (devices.length < 2 && !devices.includes(deviceId)) {
        devices.push(deviceId);
        console.log('New device added:', deviceId);
      } else if (!devices.includes(deviceId)) {
        console.log('Login rejected: Maximum 2 devices allowed. Current devices:', devices);
        return res.status(403).json({ message: 'Достигнуто максимальное количество устройств (2). Выйдите с одного из устройств.' });
      }

      console.log('Updated devices:', devices);

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          phone: user.phone,
          name: user.name,
          lastname: user.lastname,
          role: {
            id: role.id,
            name: role.name,
          },
          devices,
        },
        jwtOptions.secretOrKey,
        {
          expiresIn: 24 * 60 * 60 * 365,
        }
      );

      await user.update({ jwt_token: token });
      console.log('New JWT token saved for user:', user.id, 'Devices in token:', devices);
      res.status(200).send({ token });
    }
  }
};

const addFullProfile = async (req, res) => {
  console.log('111 AddFullProfile Started', req.body);

  const { password, phone, name, lastname, areasofactivity } = req.body;

  console.log('AddFullProfile Started', password, phone, name, lastname, areasofactivity);

  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header is missing' });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Invalid token format' });
  }

  const token = authHeader.substring(7);
  console.log('token =', token);

  const decodedToken = jwt.decode(token);
  console.log('Айди юзера который соответствует данному токену', decodedToken);

  let user = await User.findOne({ where: { email: decodedToken.email } });

  console.log('SELECTED USER=', user);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const userWithPhone = await User.findOne({ where: { phone } });
  if (userWithPhone && userWithPhone.id !== user.id) {
    return res.status(400).json({ message: 'Номер телефона уже используется другим пользователем' });
  }

  user.password = password;
  user.phone = phone;
  user.name = name;
  user.lastname = lastname;
  user.areasofactivity = areasofactivity;

  await user.save();

  res.status(200).send(user);
};

const signUp = async (req, res) => {
  try {
    const role = await Role.findOne({
      where: {
        name: 'customer',
      },
    });

    const company = await Company.create({
      name: req.body.company_name,
      description: req.body.company_description,
      bin: req.body.company_bin,
      address: req.body.company_address,
      logo: '/company/' + req.file.filename,
    });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    await User.create({
      email: req.body.email,
      full_name: req.body.full_name,
      password: hashedPassword,
      companyId: company.id,
      roleId: role.id,
    });

    res.status(200).end();
  } catch (error) {
    res.status(500).send(error);
  }
};

const exportReviewsToExcel = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'name', 'lastname', 'review'],
      where: {
        review: {
          [Op.ne]: null,
        },
      },
      raw: true,
    });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'Отзывы не найдены' });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Your App';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Reviews');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Имя', key: 'name', width: 20 },
      { header: 'Фамилия', key: 'lastname', width: 20 },
      { header: 'Отзыв', key: 'review', width: 50 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDDDDDD' },
    };

    users.forEach((user) => {
      let reviewText = 'Нет отзыва';
      try {
        const reviewData = JSON.parse(user.review);
        if (reviewData && reviewData.blocks && reviewData.blocks.length > 0) {
          reviewText = reviewData.blocks
            .map((block) => block.data?.text || '')
            .filter((text) => text)
            .join('\n');
        }
      } catch (error) {
        console.error(`Ошибка парсинга отзыва для пользователя ${user.id}:`, error);
        reviewText = 'Ошибка при парсинге отзыва';
      }

      worksheet.addRow({
        id: user.id,
        email: user.email,
        name: user.name || 'Не указано',
        lastname: user.lastname || 'Не указано',
        review: reviewText,
      });
    });

    worksheet.autoFilter = {
      from: 'A1',
      to: `E${users.length + 1}`,
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="User_Reviews.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Ошибка при экспорте отзывов в Excel:', error);
    res.status(500).json({ message: 'Ошибка сервера при экспорте отзывов' });
  }
};

module.exports = {
  aUTH,
  verifyLink,
  checkEmail,
  sendVerificationEmail,
  allCompanies,
  exportReviewsToExcel,
  verifyCode,
  forgotPassword,
  resetPassword,
  signUp,
  logIn,
  logOut,
  getAuthenticatedUserInfo,
  createCompany,
  addFullProfile,
  updateUserRole,
  getAllUsers,
  verifyCodeInspector,
  companySearchByBin,
  companySearchByContactEmail,
  companySearchByContactPhone,
  companySearchByName,manageDevices
};
