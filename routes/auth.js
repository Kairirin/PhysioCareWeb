const express = require("express");
let User = require(__dirname + '/../models/users.js');
let router = express.Router();

router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', (req, res) => {
  let login = req.body.login;
  let password = req.body.password;

  User.find()
    .then((result) => {
        if(result) {
            let existe = result.filter(u => u.login == login);

            if(existe.length === 1 && bcrypt.compareSync(password, existe[0].password)){
                req.session.login = existe.login;
                req.session.id = existe._id;
                req.session.rol = existe.rol;
                res.redirect('/public/index.html');
            }
            else 
                res.render("error", {error: "Login no válido"});
        }
    })
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
