const fs = require('fs');
require('dotenv').config(); // Подключаем dotenv для загрузки переменных из .env

module.exports = {
    development: {
        username: process.env.DEV_DB_USERNAME,
        password: process.env.DEV_DB_PASSWORD,
        database: process.env.DEV_DB_NAME,
        host: process.env.DEV_DB_HOST,
        dialect: process.env.DEV_DB_DIALECT,
    },
    // production: {
    //     username: process.env.PROD_DB_USERNAME,
    //     password: process.env.PROD_DB_PASSWORD,
    //     database: process.env.PROD_DB_NAME,
    //     host: process.env.PROD_DB_HOST,
    //     port: parseInt(process.env.PROD_DB_PORT, 10), // Преобразуем порт в число
    //     dialect: process.env.PROD_DB_DIALECT,
    //     dialectOptions: {
    //         ssl: {
    //             ca: fs.readFileSync('config/ca-certificate.crt'), // Сертификат остается, если нужен
    //         },
    //     },
    // },
};