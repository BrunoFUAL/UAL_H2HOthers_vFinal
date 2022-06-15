const express = require("express");
const authController = require('../controllers/auth');
const router = express.Router();


const path = require('path');
const mysql = require("mysql");



// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'h2hothers'
// })

router.get('/', (req, res) => {
    res.render(path.join(__dirname, '../public/views/index.hbs'));
});

router.get('/registar', (req, res) => {
    res.render(path.join(__dirname, '../public/views/register.hbs'));
});

router.get('/login', (req, res) => {
    res.render(path.join(__dirname, '../public/views/login.hbs'));
});


router.get('/login_admin', (req, res) => {
    res.render(path.join(__dirname, '../public/views/login_admin.hbs'));
});

router.get('/admin', authController.isLoggedIN_admin ,(req, res) => {
    if ( req.user ) {
    res.render(path.join(__dirname, '../public/views/admin.hbs'), {user:req.user});
    } else {
    res.redirect('/login_admin');
    }
});


router.get('/loja', authController.isLoggedIN, (req, res) => {
    if ( req.user ) {
    res.render(path.join(__dirname, '../public/views/loja.hbs'), {user:req.user});
} else {
    res.redirect('/login');
}
});

router.get('/cart', (req, res) => {
    res.render(path.join(__dirname, '../public/views/cart.hbs'));
});

router.get('/voluntario', authController.isLoggedIN, (req, res) => {
    if ( req.user ) {
        res.render(path.join(__dirname, '../public/views/voluntario.hbs'), {user:req.user});
    } else {
        res.redirect('/login');
    }

});

router.get('/home', (req, res) => {
    res.statusCode == 200;
    res.setHeader('Content-Type', 'application/json');

    db.query('SELECT * from comments', function(error, results, fields){
        // if(error) throw error;
    
        var comments = JSON.stringify(results);
    
        res.end(comments);
    
    });
})

router.post('/insert', (req, res) => {
    res.statusCode == 200;
    res.setHeader('Content-Type', 'text/plain');


        content = req.body;

        console.log("The user name is" + content.name);
        console.log("The comment is" + content.message);

        db.query('INSERT INTO comments (comments.userName, comments.comment) VALUES (?,?)',[content.name, content.message], function(error, results, fields){
            if(error) throw error;
            console.log("Inserção de Comentário com sucesso");
        
        });

        res.end("Sucesso!");
})






module.exports = router;
