const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const { promisify } = require("util");

const fs = require("fs");
const fastcsv = require('fast-csv');
const ws = fs.createWriteStream('./public/uploads/inscricao_eventos.csv');
const ws1 = fs.createWriteStream('./public/uploads/voluntarios.csv');
const ws2 = fs.createWriteStream('./public/uploads/associacoes.csv');
const ws3 = fs.createWriteStream('./public/uploads/patrocinadores.csv');


dotenv.config({ path: "./.env" });

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

// const db = mysql.createConnection({
//   host: process.env.DATABASE_HOST,
//   user: process.env.DATABASE_USER,
//   password: process.env.DATABASE_PASSWORD,
//   database: process.env.DATABASE,
// });

exports.register = async (req, res) => {
  console.log(req.body);

  const { name, email, password, passwordConfirm } = req.body;

  if (!email || !password || !name || !passwordConfirm) {
    return (
      res.render('register', {message: 'Deverá preencher todos os campos'}),
      console.log("por favor preencha e-mail e password")
    );
  }

  connection.query(
    "SELECT email FROM users WHERE email = ?",
    [email],
    async (error, results) => {
      if (error) {
        console.log(error);
      }
      if (results.length > 0) {
        return (
          res.render('register', {message: 'Utilizador existente, tente novamente ou efetue o login'}),
          console.log("E-mail existente")
        );
      } else if (password !== passwordConfirm) {
        return (
          res.render('register', {message: 'Passwords não coincidem, tente novamente'}),
          console.log("Passwords não coincidem")
        );
      }
      let hashedPassword = await bcrypt.hash(password, 8);
      console.log(hashedPassword);
      connection.query(
        "INSERT INTO users SET ?",
        { name: name, email: email, password: hashedPassword },
        (error, results) => {
          if (error) {
            console.log(error);
          } else {
            return (
              res.status(200).redirect("/login"),
              console.log("Utilizador registado"),
              console.log(results)
            );
          }
        }
      );
    }
  );
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return (
        res.render('login', {message: 'Por favor, preencha e-mail e password'}),
        console.log("por favor preencha e-mail e password")
      );
    }

    connection.query(
      "SELECT * from users WHERE email = ?",
      [email],
      async (error, results) => {
        console.log(results);
        if (
          !results ||
          !(await bcrypt.compare(password, results[0].password))
        ) {
          res.render('login', {message: 'E-mail ou password incorretos'}),
            console.log("E-mail ou password incorreto");
        } else {
          const id = results[0].id;

          const token = jwt.sign({ id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
          });

          console.log("The token is: " + token);

          const cookieOptions = {
            expires: new Date(
              Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
            ),
            httpOnly: true,
          };
          res.cookie("jwt", token, cookieOptions);
          res.status(200).redirect("/voluntario");
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};

exports.isLoggedIN = async (req, res, next) => {
  // console.log(req.cookies);
  if (req.cookies.jwt) {
    try {
      //1) Verify the token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      console.log(decoded);

      //2) Check if the user still exists
      connection.query(
        "SELECT * FROM users WHERE id = ?",
        [decoded.id],
        (error, result) => {
          if (!result) {
            return next();
          }

          req.user = result[0];
          return next();
        }
      );
    } catch (error) {
      console.log(error);
      return next();
    }
  } else {
    next();
  }
};

exports.logout = async (req, res) => {
  res.cookie("jwt", "logout", {
    expires: new Date(Date.now() + 2 * 1000),
    httpOnly: true,
  });

  res.status(200).redirect("/");
};

exports.login_admin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return (
        res.status(400).redirect("/login_admin"),
        console.log("por favor preencha e-mail e password")
      );
    }

    connection.query(
      "SELECT * from admins WHERE email = ?",
      [email],
      async (error, results) => {
        console.log(results);
        if (!results) {
          res.status(401).redirect("/login_admin"),
            console.log("O erro está aqui");
          console.log("E-mail ou password incorreto");
        } else {
          const id = results[0].id;

          const token = jwt.sign({ id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
          });

          console.log("The token is: " + token);

          const cookieOptions = {
            expires: new Date(
              Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
            ),
            httpOnly: true,
          };
          res.cookie("jwt", token, cookieOptions);
          res.status(200).redirect("/admin");
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};

exports.isLoggedIN_admin = async (req, res, next) => {
  // console.log(req.cookies);
  if (req.cookies.jwt) {
    try {
      //1) Verify the token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      console.log(decoded);

      //2) Check if the user still exists
      connection.query(
        "SELECT * FROM admins WHERE id = ?",
        [decoded.id],
        (error, result) => {
          if (!result) {
            return next();
          }

          req.user = result[0];
          return next();
        }
      );
    } catch (error) {
      console.log(error);
      return next();
    }
  } else {
    next();
  }
};

exports.consult_admin = (req, res) => {
  connection.query("SELECT * from admins", async (error, results) => {
    console.log(results);
    res.json(results);
  });
};

exports.register_admin = async (req, res) => {
  console.log(req.body);
  const { name, email, password, passwordConfirm } = req.body;
  
  if (!email || !password) {
    return (
      res.status(400).redirect("/login_admin"),
      console.log("por favor preencha e-mail e password")
    );
  }

  connection.query(
    "SELECT email FROM admins WHERE email = ?",
    [email],
    async (error, results) => {
      if (error) {
        console.log(error);
      }
      if (results.length > 0) {
        return (
          res.render('admin', {message: 'Administrador já registado'}),
          console.log("E-mail existente")
        );
      } else if (password !== passwordConfirm) {
        return (
          res.render('admin', {message: 'Passwords não coincidem'}),
          console.log("Passwords não coincidem")
        );
      }
      let hashedPassword = await bcrypt.hash(password, 8);
      console.log(hashedPassword);
      connection.query(
        "INSERT INTO admins SET ?",
        { name: name, email: email, password: hashedPassword },
        (error, results) => {
          if (error) {
            console.log(error);
          } else {
            return (
              res.render('admin', {message: 'Administrador registado com sucesso'}),
              console.log("Utilizador registado"),
              console.log(results)
            );
          }
        }
      );
    }
  );
};


exports.delete_vol = (req, res) => {
  const email = req.body.email;
  connection.query("DELETE from users WHERE email = email", async (error, results) => {
    res.render('admin', {message: 'Voluntário Eliminado com sucesso'}),
    console.log(results);
  });

};

exports.register_ass = async (req, res) => {
  console.log(req.body);
  const { name, email, tlf, date, info } = req.body;
  connection.query(
    "SELECT email FROM associacoes WHERE email = ?",
    [email],
    async (error, results) => {
      if (error) {
        console.log(error);
      }
      if (results.length > 0) {
        return (
          res.render('admin', {message: 'Associação já existente'}),
          console.log("E-mail existente")
        );
      } 
      connection.query(
        "INSERT INTO associacoes SET ?",
        { name: name, email: email, tlf: tlf, date: date, info: info },
        (error, results) => {
          if (error) {
            console.log(error);
          } else {
            return (
              res.render('admin', {message: 'Associação registada com sucesso'}),
              console.log("Associação Registada"),
              console.log(results)
            );
          }
        }
      );
    }
  );
};



exports.delete_ass = (req, res) => {
  const email = req.body.email;
  connection.query("DELETE from associacoes WHERE email = email", async (error, results) => {
    res.render('admin', {message: 'Associação eliminada com sucesso'}),
    console.log(results);
  });

};

exports.register_ptr = async (req, res) => {
  console.log(req.body);
  const { name, email, tlf, date, info } = req.body;
  connection.query(
    "SELECT email FROM patrocinadores WHERE email = ?",
    [email],
    async (error, results) => {
      if (error) {
        console.log(error);
      }
      if (results.length > 0) {
        return (
          res.render('admin', {message: 'Patrocinador já registado'}),
          console.log("E-mail existente")
        );
      } 
      connection.query(
        "INSERT INTO patrocinadores SET ?",
        { name: name, email: email, tlf: tlf, date: date, info: info },
        (error, results) => {
          if (error) {
            console.log(error);
          } else {
            return (
              res.render('admin', {message: 'Patrocinador registado com sucesso'}),
              console.log("Patrocinador Registado"),
              console.log(results)
            );
          }
        }
      );
    }
  );
};


exports.delete_ptr = (req, res) => {
  const email = req.body.email;
  connection.query("DELETE from patrocinadores WHERE email = email", async (error, results) => {
    res.render('admin', {message: 'Patrocinador eliminado com sucesso'}),
    console.log(results);
  });

};


exports.register_events = async (req, res) => {
  console.log(req.body);
  const { name, email, tlf, date, event } = req.body;
      connection.query(
        "INSERT INTO eventos SET ?",
        { name: name, email: email, tlf: tlf, date: date, event: event },
        (error, results) => {
          if (error) {
            console.log(error);
          } else {
            return (
              res.render('voluntario', {message: 'Registo efetuado'}),
              console.log("Inscrição Registada"),
              console.log(results)
            );
          }
        }
      );
};

exports.consult_insceventos = async (req, res) => {
  connection.query("SELECT * FROM eventos", function (err, data){
      if(err) throw err;

      const jsonData = JSON.parse(JSON.stringify(data));
      console.log("jsonData", jsonData);

      fastcsv.write(jsonData, {headers: true})
      .on("finish", function(){
          console.log("Write to inscricao_eventos.csv successfully");
      })
      .pipe(ws);
  })
}

exports.consult_voluntarios = async (req, res) => {
  connection.query("SELECT * FROM users", function (err, data){
      if(err) throw err;

      const jsonData = JSON.parse(JSON.stringify(data));
      console.log("jsonData", jsonData);

      fastcsv.write(jsonData, {headers: true})
      .on("finish", function(){
          console.log("Write to voluntarios.csv successfully");
      })
      .pipe(ws1);
  })
}

exports.consult_associacoes = async (req, res) => {
  connection.query("SELECT * FROM associacoes", function (err, data){
      if(err) throw err;

      const jsonData = JSON.parse(JSON.stringify(data));
      console.log("jsonData", jsonData);

      fastcsv.write(jsonData, {headers: true})
      .on("finish", function(){
          console.log("Write to associacoes.csv successfully");
      })
      .pipe(ws2);
  })
}

exports.consult_patrocinadores = async (req, res) => {
  connection.query("SELECT * FROM patrocinadores", function (err, data){
      if(err) throw err;

      const jsonData = JSON.parse(JSON.stringify(data));
      console.log("jsonData", jsonData);

      fastcsv.write(jsonData, {headers: true})
      .on("finish", function(){
          console.log("Write to patrocinadores.csv successfully");
      })
      .pipe(ws3);
  })
}