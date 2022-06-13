const express = require("express");
const authController = require('../controllers/auth');
const router = express.Router();

const multer = require('multer')


const fileStorageEngine = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads' )
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({storage: fileStorageEngine});

router.post('/single', upload.single('file'), (req,res) => {
    console.log(req.file);
    res.send("Upload de ficheiro único efetuado com sucesso");
});

router.post('/multiple', upload.array('files', 6), (req,res) => {
    console.log(req.files);
    res.send("Upload de ficheiros efetuado com sucesso").redirect('/admin');
});

//Define Routes

router.post('/register', authController.register)

router.post('/register_admin', authController.register_admin)

router.post('/login', authController.login)

router.post('/login_admin', authController.login_admin)

router.get('/logout', authController.logout)

// Rota para consultar administradores
router.get("/admin_consultAdm", authController.consult_admin);

router.get("/delete_Vol", authController.delete_vol);

router.post('/register_ass', authController.register_ass)


router.get("/delete_ass", authController.delete_ass);

router.post('/register_ptr', authController.register_ptr)

router.get('/exportcsv', authController.consult_insceventos)


router.get('/exportcsvvolun', authController.consult_voluntarios)

router.get('/exportcsvass', authController.consult_associacoes)

router.get('/exportcsvptr', authController.consult_patrocinadores)


router.get("/delete_ptr", authController.delete_ptr);

router.post('/register_events', authController.register_events)

// Rota para permitir efetuar upload de ficheiros



module.exports = router;