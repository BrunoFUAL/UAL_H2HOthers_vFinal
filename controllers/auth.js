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

const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
});

exports.register = async (req, res) => {
  console.log(req.body);

  const { name, email, password, passwordConfirm } = req.body;

  db.query(
    "SELECT email FROM users WHERE email = ?",
    [email],
    async (error, results) => {
      if (error) {
        console.log(error);
      }
      if (results.length > 0) {
        return (
          res.status(200).redirect("/registar"),
          console.log("E-mail existente")
        );
      } else if (password !== passwordConfirm) {
        return (
          res.status(200).redirect("/registar"),
          console.log("Passwords não coincidem")
        );
      }
      let hashedPassword = await bcrypt.hash(password, 8);
      console.log(hashedPassword);
      db.query(
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
        res.status(400).redirect("/login"),
        console.log("por favor preencha e-mail e password")
      );
    }

    db.query(
      "SELECT * from users WHERE email = ?",
      [email],
      async (error, results) => {
        console.log(results);
        if (
          !results ||
          !(await bcrypt.compare(password, results[0].password))
        ) {
          res.status(401).sendFile("/views/login.hbs", { root: "./public" }),
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
      db.query(
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

    db.query(
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
      db.query(
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
  db.query("SELECT * from admins", async (error, results) => {
    console.log(results);
    res.json(results);
  });
};

exports.register_admin = async (req, res) => {
  console.log(req.body);
  const { name, email, password, passwordConfirm } = req.body;

  db.query(
    "SELECT email FROM admins WHERE email = ?",
    [email],
    async (error, results) => {
      if (error) {
        console.log(error);
      }
      if (results.length > 0) {
        return (
            res.status(400).redirect("/admin"),
          console.log("E-mail existente")
        );
      } else if (password !== passwordConfirm) {
        return (
            res.status(400).redirect("/admin"),
          console.log("Passwords não coincidem")
        );
      }
      let hashedPassword = await bcrypt.hash(password, 8);
      console.log(hashedPassword);
      db.query(
        "INSERT INTO admins SET ?",
        { name: name, email: email, password: hashedPassword },
        (error, results) => {
          if (error) {
            console.log(error);
          } else {
            return (
              res.status(400).redirect("/admin"),
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
  db.query("DELETE from users WHERE email = email", async (error, results) => {
    res.status(200).redirect("/admin");
    console.log(results);
  });

};

exports.register_ass = async (req, res) => {
  console.log(req.body);
  const { name, email, tlf, date, info } = req.body;
  db.query(
    "SELECT email FROM associacoes WHERE email = ?",
    [email],
    async (error, results) => {
      if (error) {
        console.log(error);
      }
      if (results.length > 0) {
        return (
          res.status(400).redirect("/admin"),
          console.log("E-mail existente")
        );
      } 
      db.query(
        "INSERT INTO associacoes SET ?",
        { name: name, email: email, tlf: tlf, date: date, info: info },
        (error, results) => {
          if (error) {
            console.log(error);
          } else {
            return (
              res.status(400).redirect("/admin"),
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
  db.query("DELETE from associacoes WHERE email = email", async (error, results) => {
    res.status(200).redirect("/admin");
    console.log(results);
  });

};

exports.register_ptr = async (req, res) => {
  console.log(req.body);
  const { name, email, tlf, date, info } = req.body;
  db.query(
    "SELECT email FROM patrocinadores WHERE email = ?",
    [email],
    async (error, results) => {
      if (error) {
        console.log(error);
      }
      if (results.length > 0) {
        return (
          res.status(400).redirect("/admin"),
          console.log("E-mail existente")
        );
      } 
      db.query(
        "INSERT INTO patrocinadores SET ?",
        { name: name, email: email, tlf: tlf, date: date, info: info },
        (error, results) => {
          if (error) {
            console.log(error);
          } else {
            return (
              res.status(400).redirect("/admin"),
              console.log("Associação Registada"),
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
  db.query("DELETE from patrocinadores WHERE email = email", async (error, results) => {
    res.status(200).redirect("/admin");
    console.log(results);
  });

};


exports.register_events = async (req, res) => {
  console.log(req.body);
  const { name, email, tlf, date, event } = req.body;
  db.query(
    "SELECT email FROM eventos WHERE email = ?",
    [email],
    async (error, results) => {
      if (error) {
        console.log(error);
      }
      if (results.length > 0) {
        return (
          res.status(400).redirect("/voluntario"),
          console.log("E-mail existente")
        );
      } 
      db.query(
        "INSERT INTO eventos SET ?",
        { name: name, email: email, tlf: tlf, date: date, event: event },
        (error, results) => {
          if (error) {
            console.log(error);
          } else {
            return (
              res.status(400).redirect("/voluntario"),
              console.log("Inscrição Registada"),
              console.log(results)
            );
          }
        }
      );
    }
  );
};

exports.consult_insceventos = async (req, res) => {
  db.query("SELECT * FROM eventos", function (err, data){
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
  db.query("SELECT * FROM users", function (err, data){
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
  db.query("SELECT * FROM associacoes", function (err, data){
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
  db.query("SELECT * FROM patrocinadores", function (err, data){
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