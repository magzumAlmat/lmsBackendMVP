const express= require('express');
const cors=require('cors');
// const dotenv=require('dotenv');
// dotenv.config();


const PORT=4000;
const app=express();


// app.use(express.json());
app.use(cors());


app.use(express.urlencoded({ extended: true })); //сериализация   на уровне экспресса для того чтобы бэк понял пост запрос 
app.use(express.json())

// app.use(express.static(__dirname+'/public'))


app.use(require('./auth/routes'))

app.use(express.urlencoded({ extended: true })); //сериализация   на уровне экспресса для того чтобы бэк понял пост запрос 
app.use(express.json())

app.listen(PORT,(err)=>{
    if(err){
        process.exit(1);
    }
    console.log(`SERVER RUN AT${{PORT}}`)
});