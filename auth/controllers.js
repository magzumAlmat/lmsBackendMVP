// const sendMail = require("../utils/sendMail")
// const AuthCode =require('./AuthCode')
// const Role = require('./Role')
// const User=require('./User')

// const jwt = require('jsonwebtoken');
// const {jwtOptions} = require('./passport');
// const { where } = require("sequelize");

const { Op } = require('sequelize');
const AuthCode = require('./models/AuthCode')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt')
const User = require('../auth/models/User')
const Role = require('./models/Role')
const {jwtOptions,passport} = require('./passport');
const Company= require('./models/Company')
const sendEmail = require('../auth/utils/sendMail')
const ExcelJS = require('exceljs');
const PasswordResetToken = require('../auth/models/PasswordResetToken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Ваш email
    pass: process.env.EMAIL_PASS, // Пароль или app-specific password
  },
});

// Запрос на сброс пароля
const forgotPassword = async (req, res) => {
  console.log('ForgotPassword started!')
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'Пользователь с таким email не найден' });
    }

    // Генерация токена
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 час

    // Сохранение токена в базе
    await PasswordResetToken.create({
      userId: user.id,
      token,
      expiresAt,
    });

    // Формирование ссылки для сброса
    const resetLink = `https://lms.kazniisa.kz/reset-password?token=${token}`;

    // Отправка письма
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
// const resetPassword = async (req, res) => {
//   console.log('resetPasswordStarted!')
//   const { token, newPassword } = req.body;

//   try {
//     const resetToken = await PasswordResetToken.findOne({
//       where: { token },
//       include: [{ model: User, as: 'User' }],
//     });

//     if (!resetToken || resetToken.expiresAt < new Date()) {
//       return res.status(400).json({ error: 'Токен недействителен или истек' });
//     }

//     const user = resetToken.User;
//     user.password = newPassword; // Пароль будет захеширован в beforeUpdate
//     await user.save();

//     // Удаляем использованный токен
//     await resetToken.destroy();

//     res.status(200).json({ message: 'Пароль успешно изменен' });
//   } catch (error) {
//     console.error('Ошибка при сбросе пароля:', error);
//     res.status(500).json({ error: 'Ошибка сервера' });
//   }
// };
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
// User.beforeUpdate(async (user) => {
//   if (user.changed('password')) {
//     const salt = await bcrypt.genSalt(10);
//     user.password = await bcrypt.hash(user.password, salt);
//   }
// });
User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    console.log('Password changed, hashing...');
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    console.log('Password hashed');
  }
});

const getAllUsers = async (req, res) => {
  console.log('getAllUsers started!')
  try {
    // Получаем всех пользователей из базы данных
    const users = await User.findAll({
      attributes: ['id', 'email', 'name', 'lastname', 'phone', 'roleId','areasofactivity'], // Выбираем только нужные поля
      include: [
        {
          model: Role, // Подключаем связь с моделью Role
          attributes: ['id', 'name'], // Выбираем только нужные поля из Role
        },
      ],
    });

   
    // Проверяем, есть ли пользователи
    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'Пользователи не найдены' });
    }

    // Возвращаем список пользователей
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
  console.log(' 1 я внутри updateUserRole')
  try {
      const { userId } = req.params; // ID пользователя из параметров URL
      const { roleId } = req.body; // Новый roleId из тела запроса

      console.log('2 userId= ',userId,' roleId= ',roleId)
      // Проверяем, существует ли пользователь
      const user = await User.findByPk(userId);
      if (!user) {
          return res.status(404).json({ message: 'Пользователь не найден' });
      }
      console.log('3 user= ',user)
      // Проверяем, существует ли роль с указанным roleId
      const role = await Role.findByPk(roleId);
      if (!role) {
          return res.status(404).json({ message: 'Роль не найдена' });
      }

      console.log('4 role= ',role)
      // Обновляем roleId у пользователя
      user.roleId = roleId;
      await user.save();

      // Возвращаем успешный ответ
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

// const getAuthentificatedUserInfo=async(req,res)=>{
//   console.log('reqUSER fROM getAuthentificatedUserInfo= ',req.user.id)

//     try {
//       const USER = await User.findOne({
//         where: {
//           id: req.user.id
//         },
//       });
  
    
//       res.json(USER);
      
//     } catch (error) {
//       console.error('Error:', error);
//       res.status(500).json({ error: 'Failed to search by name' });
//     }



// }


const getAuthentificatedUserInfo = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Токен отсутствует" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] }, // Исключаем пароль из ответа
    });

    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Ошибка в getAuthenticatedUserInfo:", error);
    res.status(401).json({ error: "Недействительный токен" });
  }
};


const createCompany=async(req,res)=>{
    
    try {
        // Извлекаем данные из тела запроса
        const { name, bin, description, address, contactPhone,contactEmail,isUR} = req.body;
        console.log('phone',req.body.contactPhone,'email',req.body.contactEmail, 'isUR', isUR)
        // Создаем новую запись в базе данных

        const existingCompany = await Company.findOne({
          where: {
            [Op.or]: [
              { name },
              { bin },
              { contactEmail },
              { contactPhone },
            ],
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
        })
    
        // const authHeader = req.headers['authorization'];

        // if (!authHeader) {
        //     return res.status(401).json({ message: 'Authorization header is missing' });
        // }

        // Check if the header starts with "Bearer "
        // if (!authHeader.startsWith('Bearer ')) {
        //     return res.status(401).json({ message: 'Invalid token format' });
        // }

        // Extract the token (remove "Bearer " from the header)
        // const token = authHeader.substring(7);

        // Now you have the JWT token in the 'token' variable
        // console.log('JWT Token:', token);

        // const UserId=jwt.decode(token)
        // console.log('Айди юзера который соответствует данному токену', UserId.id);

        
        // let user = await User.findOne({where: { id:UserId.id }})

        // if (!user) {
        //     return res.status(404).json({ message: 'User not found' });
        //   }
          
        
          // user.companyId = Comp.id;
      
      
          
        // await user.save();
        
        console.log('User companyId должна перезаписаться')
        
        // Отправляем успешный ответ с новой записью
        res.status(201).json(Comp);

        

      } catch (error) {
        // В случае ошибки отправляем статус 500 и сообщение об ошибке
        console.error(error);
        res.status(500).json({ error: 'Не удалось создать запись в базе данных' });
      }
}

const companySearchByName = async (req, res) => {
    const { name } = req.params;
    console.log('name==',name)
    try {
      const companies = await Company.findAll({
        where: {
          name: {
            [Op.iLike]: `%${name}%`, // Case-insensitive partial match
          },
        },
      });
  
      // console.log('result',companies)
      res.json(companies);
      
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Failed to search by name' });
    }
  };

const allCompanies   = async (req, res) => {
  const { name } = req.params;
  console.log('name==',name)
  try {
    const companies = await Company.findAll();

    // console.log('result',companies)
    res.json(companies);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to search by name' });
  }
};
  const companySearchByBin = async (req, res) => {
    const { bin } = req.params;
  
    console.log('thisis bin',req.params.bin)
    try {
      const companies = await Company.findAll({
        where: {
          bin: {
            [Op.iLike]: `%${bin}%`, // Case-insensitive partial match
          },
        },
      });
  
      
      res.status(200).send(companies)
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
            [Op.iLike]: `%${contactPhone}%`, // Case-insensitive partial match
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
            [Op.iLike]: `%${contactEmail}%`, // Case-insensitive partial match
          },
        },
      });
  
      res.json(companies);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Failed to search by contact email' });
    }
  };


const checkEmail=async(req,res)=>{
 
      const { email } = req.query;
    
      try {
        const user = await User.findOne({ where: { email } }); // Ищем пользователя в базе данных
        res.json({ exists: !!user }); // Возвращаем true, если пользователь найден
      } catch (error) {
        res.status(500).json({ error: 'Ошибка при проверке email' });
      }
}

const aUTH=async(req,res)=>{
  const { email, password, phone, name, lastname,roleId } = req.body;
  console.log('roleId= ',roleId)
  try {
    const user = await User.create({ email, password, phone, name, lastname});

    // Отправка письма для подтверждения
    const verificationLink = `${process.env.VERIFY_URL}/api/auth/verifylink/${user.id}`;
    await sendEmail(
      user.email,
      "Подтверждение регистрации",
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
}  

const sendVerificationEmail=(req,res)=>{
    console.log('req.body',req.body)
    let fullcode=Math.floor(1000 + Math.random() * 9000).toString().slice(0, 4);

    const code='Ваш код авторизации:        '+fullcode;
    

    AuthCode.create({
        email:req.body.email,
        code:fullcode,
        valid_till: Date.now() + 300000 //5 minutes
    })
    
    sendEmail(req.body.email,"Код авторизации для lms",code)
    res.status(200).send(code)
    res.send('Mail SENDED')
}


const verifyLink=async(req,res)=>{
  console.log('Im in VerifyLink')
  try {
    const user = await User.findByPk(req.params.id);

    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    // user.roleId=3;
    // user.isVerified = true;
    await user.save();
    console.log('User= ',user)

   
    res.redirect(`${process.env.VERIFY_URL}/login?verified=success`);
  
    // res.status(200).json({ message: 'Email подтвержден' })
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

const logIn=async(req,res)=>{
  console.log('IAM IN LOGIN controller')
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({ message: 'Ошибка аутентификации', info });
    }
    // Генерация JWT-токена
    const payload = { id: user.id, email: user.email };
    const token = jwt.sign(payload, jwtOptions.secretOrKey, { expiresIn: '1h' }); // Токен действителен 1 час
    console.log('Это токен- ',token)
    return res.status(200).json({ message: 'Успешный вход', token });
    
  })(req, res);
}

//верификация сразу же запускает customer в аккаунт без заполнения данных
const verifyCode=async(req,res)=>{

    const authCode=await AuthCode.findOne(
        {where:{email: req.body.email},
        order:[['valid_till','DESC']] } 
    )
    if (!authCode){
        console.log(1,typeof(1))
        res.status(401).send({error:"EMAIL NOT FOUND"})
    }else if((new Date(authCode.valid_till).getTime()) < Date.now()){
        console.log(2)
        console.log(new Date(authCode.valid_till).getTime())
        console.log(Date.now())
        res.status(401).send({error:"время прошло"})
    }else if(authCode.code !== req.body.code){
        console.log(3)
        res.status(401).send({error:"код не совпадает"})
    }
    else{
        console.log(4)
        const role = await Role.findOne({where: { name: 'teacher' }})
        let user = await User.findOne({where: { email: req.body.email }})
        console.log('1 USER=',user)
       
      

        if (!role) {
            // Handle the case where the role 'employee' is not found.
            res.status(401).send({ error: "Role 'teacher' not found" });
        } else {
            let user = await User.findOne({ where: { email: req.body.email } });
        
            if (!user) {
              console.log('User не найден -  щас создадим','rode.id= ',role.id)
                // Create a new user if it doesn't exist
                user = await User.create({
                    roleId: role.id, // Make sure role.id exists
                    email: req.body.email
                });
            }
        
            console.log('iam in create user')
    
  
    if (!user) {
        try {
          user = await User.create({
            roleId: role.id, // Make sure role.id exists
            email: req.body.email
        });
            const token = jwt.sign({
              id: user.id,
              email: user.email,
              // full_name: user.full_name,
              phone: user.phone,
              name:user.name,
              lastname:user.lastname,
              companyId:user.companyId,
              role: {
                  id: role.id,
                  name: role.name
              }
          }, jwtOptions.secretOrKey,
          {
              expiresIn: 24 * 60 * 60 * 365
          });
          res.status(200).send({token});
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to create user' });
        }
    } else {
      const token = jwt.sign({
        id: user.id,
        email: user.email,
        companyId:user.companyId,
        phone: user.phone,
        name:user.name,
        lastname:user.lastname,
        role: {
            id: role.id,
            name: role.name
        }
    }, jwtOptions.secretOrKey,
    {
        expiresIn: 24 * 60 * 60 * 365
    });
    res.status(200).send({token});
    }

            // Rest of your code...
        }
        
      
      
       console.log('before create token ,User=',user)
       


        // res.status(200).send(user)
    }

   
}   

const verifyCodeInspector=async(req,res)=>{
    const authCode=await AuthCode.findOne(
        {where:{email: req.body.email},
        order:[['valid_till','DESC']] } 
    )
    if (!authCode){
        // console.log(1,typeof(1))
        res.status(401).send({error:"EMAIL NOT FOUND"})
    }else if((new Date(authCode.valid_till).getTime()) < Date.now()){
        // console.log(2)
        // console.log(new Date(authCode.valid_till).getTime())
        // console.log(Date.now())
        res.status(401).send({error:"время прошло"})
    }else if(authCode.code !== req.body.code){
        // console.log(3)
        res.status(401).send({error:"код не совпадает"})
    }
    else{
        console.log(4)
        const role = await Role.findOne({where: { name: 'inspector' }})
        let user = await User.findOne({where: { email: req.body.email }})
        
       
        if (!role) {
            // Handle the case where the role 'employee' is not found.
            res.status(401).send({ error: "Role 'inspector' not found" });
        } else {
            let user = await User.findOne({ where: { email: req.body.email } });
        
            if (!user) {
                // Create a new user if it doesn't exist
                user = await User.create({
                    roleId: role.id, // Make sure role.id exists
                    email: req.body.email
                });
            }
        

            // Rest of your code...
        }
        

       console.log('before create token ,User=',user)
        const token = jwt.sign({
            id: user.id,
            email: user.email,
            // full_name: user.full_name,
            phone: user.phone,
            name:user.name,
            lastname:user.lastname,
            role: {
                id: role.id,
                name: role.name
            }
        }, jwtOptions.secretOrKey,
        {
            expiresIn: 24 * 60 * 60 * 365
        });
        res.status(200).send({token});


        // res.status(200).send(user)
    }

   
}  




// c onst addFullProfile = async(req,res)=>{

//   console.log('111 AddFullProfile Started',req.body)

//   const {password,phone,name,lastname}=req.body

//   console.log('AddFullProfile Started',password,phone,name,lastname)

//   const authHeader = req.headers['authorization'];

//   if (!authHeader) {
//       return res.status(401).json({ message: 'Authorization header is missing' });
//   }

//   // Check if the header starts with "Bearer "
//   if (!authHeader.startsWith('Bearer ')) {
//       return res.status(401).json({ message: 'Invalid token format' });
//   }

//   // Extract the token (remove "Bearer " from the header)
//   const token = authHeader.substring(7);
//   console.log('token =',token)
//   // Now you have the JWT token in the 'token' variable
//   // console.log('JWT Token:', token);

//   const decodedToken=jwt.decode(token)
//   console.log('Айди юзера который соответствует данному токену', decodedToken);

  
//   let user = await User.findOne({where: { email:decodedToken.email }})

//   console.log('SELECTED USER=',user)
//   if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
//     user.password = password;
//     user.phone = phone;
//     user.name = name;
//     user.lastname = lastname;
        
//     await user.save();
    
//     res.status(200).send(user);
// }


const addFullProfile = async (req, res) => {
  console.log('111 AddFullProfile Started', req.body);

  const { password, phone, name, lastname ,areasofactivity} = req.body;

  console.log('AddFullProfile Started', password, phone, name, lastname,areasofactivity);

  // if (!phone || !/^\d{10}$/.test(phone)) {
  //   return res.status(400).json({ message: 'Некорректный номер телефона. Номер должен содержать 10 цифр.' });
  // }

  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header is missing' });
  }

  // Check if the header starts with "Bearer "
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Invalid token format' });
  }

  // Extract the token (remove "Bearer " from the header)
  const token = authHeader.substring(7);
  console.log('token =', token);
  // Now you have the JWT token in the 'token' variable
  // console.log('JWT Token:', token);

  const decodedToken = jwt.decode(token);
  console.log('Айди юзера который соответствует данному токену', decodedToken);

  let user = await User.findOne({ where: { email: decodedToken.email } });

  console.log('SELECTED USER=', user);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Проверка уникальности номера телефона
  const userWithPhone = await User.findOne({ where: { phone } });
  if (userWithPhone && userWithPhone.id !== user.id) {
    return res.status(400).json({ message: 'Номер телефона уже используется другим пользователем' });
  }

  user.password = password;
  user.phone = phone;
  user.name = name;
  user.lastname = lastname;
  user.areasofactivity=areasofactivity;

  await user.save();

  res.status(200).send(user);
};


const signUp = async (req, res) =>{
    try {
        const role = await Role.findOne({
            where: {
                name: 'customer'
            }
        })
        
        const company = await Company.create({

            name: req.body.company_name,
            description: req.body.company_description,
            bin:req.body.company_bin,
            address: req.body.company_address,
            logo: '/company/' + req.file.filename

        })
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt)

        await User.create({
            email: req.body.email,
            full_name: req.body.full_name,
            password: hashedPassword,
            companyId: company.id,
            roleId: role.id,
        })

        res.status(200).end();
    } catch (error) {
        res.status(500).send(error)
    }
}

// const logIn = async (req, res) =>{
//     console.log('iam in auth user')
//     let user = await User.findOne({where: {email: req.body.email}});

//     const {  password } = req.body;

//     // const isPasswordValid = await bcrypt.compare(password, user.password);
//     if(password===user.password){
//                       isPasswordValid=true
//                     }
//                     else{
//                       isPasswordValid=false
//                     }
//     console.log(user,'COMPARE=',password,'==',user.password,'isMtch=',isPasswordValid)
//     if (!isPasswordValid) {
//       return res.status(401).json({ error: 'Invalid email or password' });
//     }
//     const token = jwt.sign({
//         id: user.id,
//         email: user.email,
//         password:user.password,
//     }, jwtOptions.secretOrKey, {
//         expiresIn: 24 * 60 * 60 * 365
//     });
//     res.status(200).json({ prompt: 'Authorization successful' ,token});



//   // console.log('LOGIN ',req.body.email,req.body.password)
//   //   try {
//   //       if(
//   //           !req.body.email
//   //           || req.body.email.length === 0
//   //           || !req.body.password
//   //           || req.body.password.length === 0){
//   //               res.status(401).send({message: "Bad credentials"})
//   //           }else{
//   //               const user = await User.findOne({
//   //                   where: {
//   //                       email: req.body.email
//   //                   }
//   //               })
//   //               if(!user) return res.status(401).send({message: "User with that email is not exists"})

                
//   //               // const isMatch = await bcrypt.compare(req.body.password, user.password)
//   //               if(req.body.password===user.password){
//   //                 isMatch=true
//   //               }
//   //               else{
//   //                 isMatch=false
//   //               }

//   //               console.log(user,'COMPARE=',typeof(req.body.password),'==',typeof(user.password),'isMtch=',isMatch)
                
//   //               if(isMatch){
//   //                   const role = await Role.findByPk(user.roleId)
//   //                   const token = jwt.sign({
//   //                       id: user.id,
//   //                       email: user.email,
//   //                       role: {
//   //                           id: role.id,
//   //                           name: role.name
//   //                       }
//   //                   }, jwtOptions.secretOrKey, {
//   //                       expiresIn: 24 * 60 * 60 * 365
//   //                   });
//   //                   res.status(200).send({token});
//   //               }else{
//   //                   res.status(401).send({message: "Password is incorrect"})
//   //               }
//   //           }
//   //   } catch (error) {
//   //       res.status(500).send(error)
//   //   }      
// }



const exportReviewsToExcel = async (req, res) => {
    try {
        // Получаем всех пользователей с их отзывами
        const users = await User.findAll({
            attributes: ['id', 'email', 'name', 'lastname', 'review'], // Выбираем нужные поля
            where: {
                review: {
                    [Op.ne]: null // Фильтруем только пользователей с непустыми отзывами
                }
            },
            raw: true // Возвращаем данные в виде простого объекта
        });

        if (!users || users.length === 0) {
            return res.status(404).json({ message: 'Отзывы не найдены' });
        }

        // Создаем новую рабочую книгу Excel
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Your App'; // Автор файла
        workbook.created = new Date(); // Дата создания

        // Добавляем лист в книгу
        const worksheet = workbook.addWorksheet('Reviews');

        // Определяем заголовки столбцов
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Имя', key: 'name', width: 20 },
            { header: 'Фамилия', key: 'lastname', width: 20 },
            { header: 'Отзыв', key: 'review', width: 50 },
        ];

        // Стили для заголовков
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDDDDDD' } // Серый фон для заголовков
        };

        // Добавляем данные пользователей в таблицу, извлекая только поле data.text
        users.forEach(user => {
            let reviewText = 'Нет отзыва';
            try {
                // Парсим JSON из строки review
                const reviewData = JSON.parse(user.review);
                // Извлекаем текст из всех блоков
                if (reviewData && reviewData.blocks && reviewData.blocks.length > 0) {
                    reviewText = reviewData.blocks
                        .map(block => block.data?.text || '') // Берем только data.text
                        .filter(text => text) // Убираем пустые строки
                        .join('\n'); // Объединяем тексты из блоков с переносом строки
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
                review: reviewText
            });
        });

        // Настраиваем автофильтр для таблицы
        worksheet.autoFilter = {
            from: 'A1',
            to: `E${users.length + 1}`
        };

        // Устанавливаем заголовки для скачивания файла
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="User_Reviews.xlsx"');

        // Записываем файл в поток и отправляем его клиенту
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Ошибка при экспорте отзывов в Excel:', error);
        res.status(500).json({ message: 'Ошибка сервера при экспорте отзывов' });
    }
};

module.exports = { exportReviewsToExcel };

module.exports={aUTH,verifyLink,checkEmail,
    sendVerificationEmail,allCompanies,exportReviewsToExcel,
    verifyCode,forgotPassword,resetPassword,
    signUp,
    logIn,getAuthentificatedUserInfo,
    createCompany,addFullProfile,updateUserRole,getAllUsers,
    verifyCodeInspector,companySearchByBin,companySearchByContactEmail,companySearchByContactPhone,companySearchByName
}