const express = require("express");
const bcrypt = require('bcrypt');
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
            let existe = result.filter(u => u.login == login && u.password == password);

            /* if(existe.length === 1 && bcrypt.compareSync(password, existe[0].password)){ */
            if(existe.length == 1){
                req.session.login = existe[0].login;
                req.session.id = existe[0]._id;
                req.session.rol = existe[0].rol;
                console.log(req.session);
                res.redirect('/patients');
            }
            else{
                res.render("error", {error: "Login no válido"});
            } 
        }
    })
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
