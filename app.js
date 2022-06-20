const http = require("http");
const express = require("express");
const app = express();
const path = require('path');
const mysql = require("mysql");
const dotenv = require("dotenv");
const cookieParser = require('cookie-parser');
const authController = require('./controllers/auth');
const favicon = require('serve-favicon');




dotenv.config({ path: './.env' });

app.use(express.static(path.join(__dirname, 'public')));

app.use(favicon(path.join(__dirname, 'public/favicon.ico')))
// Permite transmitir informação do front-end para o Back-end
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Faz o parse (validação e interpretação) de solicitações do tipo application/json

app.use(cookieParser());
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'hbs');
app.set('views', './public/views');



//Acessos Base de Dados

let connection;

if (process.env.JAWSDB_URL){
    connection = mysql.createConnection(process.env.JAWSDB_URL);
} else {
    connection = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
})
}

// db.connect((error) => {
//     if(error){
//         console.log(error)
//     }else {
//         console.log("MYSQL Connected...")
//     }
// })


// Define Rotas//



app.use('/', require('./routes/pages'))
app.use('/products', require('./routes/products'))
app.use('/checkout', require('./routes/checkout'))

app.use('/auth', require('./routes/auth'));

app.listen(process.env.PORT || 5000, () => {
    console.log("Server started on Port 5000")
})