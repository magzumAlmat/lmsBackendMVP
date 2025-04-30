const Role = require('../auth/models/Role')
const User = require('../auth/models/User')

const isTeacher = async (req, res, next) => {
    console.log('isTeacher started     ')
    // console.log('req.user= ',req.user)
    try {
        if(req.user){
            const role = await Role.findByPk(req.user.roleId)
            console.log('ROLE= ',role.name)
            if(role.name === "teacher") next()
            else res.status(403).send({message: "Access denied"})
        }
        else res.status(403).send({message: "Unauthorized"})
    } catch (error) {
        res.status(500).send(error)
    }
}

const isStudent = async (req, res, next) => {
    console.log('isManager Started')
    try {
        if(req.user){
            const role = await Role.findByPk(req.user.roleId)

            if(role.name === "student") next()
            else res.status(403).send({message: "Access denied"})
        }
        else res.status(403).send({message: "Unauthorized"})
    } catch (error) {
        res.status(500).send(error)
    }
}

const isAdmin = async (req, res, next) => {
    console.log('isAdmin Started')
    try {
        if(req.user){
            const role = await Role.findByPk(req.user.roleId)

            if(role.name === "admin") next()
            else res.status(403).send({message: "Access denied"})
        }
        else res.status(403).send({message: "Unauthorized"})
    } catch (error) {
        res.status(500).send(error)
    }
}
const validateSignUp = async (req, res, next) =>{
    try {
        let errors = {}

        if(!req.body.email || req.body.email.length === 0){
            errors.email = "Поле Email не заполнено"
        }
        if(!req.body.full_name || req.body.full_name.length === 0){
            errors.full_name = "Поле Имя и Фамилия не заполнено"
        }
        if(!req.body.company_name || req.body.company_name.length === 0){
            errors.company_name = "Поле Название компании не заполнено"
        }
        if(!req.body.password || req.body.password.length === 0){
            errors.password = "Поле Пароль не заполнено"
        }
        if(!req.body.password2 || req.body.password2.length === 0){
            errors.password2 = "Поле Подтверждение пароля не заполнено"
        }

        if(req.body.password !== req.body.password2){
            errors.password2 = "Пароли не совпадают"
        }
        const user = await User.findOne({
            where: {
                email: req.body.email
            }
        })

        if(user) {
            errors.email = "Пользователь с таким Email уже зарегистрирован"
        }

        if(JSON.stringify(errors) !== JSON.stringify({}))
        res.status(400).send(errors)
        else next()
    } catch (error) {
        res.status(500).send(error)
    }
}

module.exports = {
    isAdmin,
    isStudent,
    isTeacher,
    validateSignUp
}