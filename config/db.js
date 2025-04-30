const fs = require('fs')
const{Sequelize} = require('sequelize');

let sequelize;
const dbConf = require('./config')
if (process.env.NODE_ENV==='production'){
    console.log('prod MODE TURNED ON')
     sequelize = new Sequelize({
        database:dbConf.production.database, 
        username:dbConf.production.username,
        host:dbConf.production.host,
        dialect:dbConf.production.dialect,
        password:dbConf.production.password, 
        port:dbConf.production.port,
        dialectOptions: {
            ssl: {
                ca: fs.readFileSync('config/ca-certificate.crt')
            },
        },

    })
}
else{
sequelize = new Sequelize({
    database:dbConf.development.database, 
    username:dbConf.development.username,
    host:dbConf.development.host,
    dialect:dbConf.development.dialect,
    password:dbConf.development.password, 
})
}
sequelize
    .authenticate ( )
    .then ( () => {
        console. log( 'Connection to the database has been established successfully.')
        }).catch((error) =>{

console.error('Unable to connect to the database:', error);

});

module.exports = sequelize;