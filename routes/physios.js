const express = require("express");
const bcrypt = require('bcrypt');
let Physio = require(__dirname + "/../models/physio.js");
let User = require(__dirname + "/../models/users.js");

let router = express.Router();

//GET
router.get("/", (req, res) => {
  Physio.find()
    .then((result) => {
      if (result) 
        res.render('physios_list', { physios: result });
      else 
      res.render('error', { error: 'No hay fisios en el sistema'});
    })
    .catch((error) => {
      res.render('error', { error: 'Internal Server Error'});
    });
});

//GET ESPECIALIDAD
router.get("/find", (req, res) => {
  Physio.find({ specialty: req.query.specialty })
    .then((result) => {
      if (result) 
        res.render('physios_list', { physios: result });
       else 
       res.render('error', { error: 'No se han encontrado fisios con esos criterios'});
    })
    .catch((error) => {
      res.render('error', { error: 'Internal Server Error'});
    });
});

//GET ESPECÍFICO
router.get("/:id", (req, res) => {
  Physio.findById(req.params.id)
    .then((result) => {
      if (result)
        res.render('physio_detail', { physio: result });
      else 
      res.render('error', { error: 'No se ha encontrado el fisio'});
    })
    .catch((error) => {
      res.render('error', { error: 'Internal Server Error'});
    });
});

//POST FISIO
router.post("/", (req, res) => {
  let idUser;
  const saltRounds = 10;
  const hash = bcrypt.hashSync(req.body.password, saltRounds);


  let newUser = new User({
    login: req.body.login,
    password: hash,
    rol: "physio",
  });

  newUser.save()
    .then((result) => {
      idUser = result._id;
      
      let physio = new Physio({
        _id: idUser,
        name: req.body.name,
        surname: req.body.surname,
        specialty: req.body.specialty,
        licenseNumber: req.body.licenseNumber
      });
      physio.save()
        .then((result) => {
          res.status(201).send({ result: result });
        })
        .catch((error) => {
          res.status(400).send({ error: "Error guardando fisio" });
        });
    });
});

//PUT FISIO
router.put("/:id", (req, res) => {
  Physio.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        name: req.body.name,
        surname: req.body.surname,
        specialty: req.body.specialty,
        licenseNumber: req.body.licenseNumber,
      }
    },
    { new: true, runValidators: true }
  )
    .then((result) => {
      if (result) res.status(200).send({ result: result });
      else
        res.status(400).send({ error: "Error actualizando los datos del fisio" });
    })
    .catch((error) => {
      res.status(500).send({ error: "Internal server error" });
    });
});

//DELETE FISIO
router.delete("/:id", (req, res) => {
  Physio.findByIdAndDelete(req.params.id)
    .then((result) => {
      if (result){
        User.findByIdAndDelete(req.params.id)
        .then((resultUser) => {
          res.status(200).send({ result: resultUser });
        });
      } 
      else
        res.status(404).send({ error: "El fisio a eliminar no existe" });
    })
    .catch((error) => {
      res.status(500).send({ error: "Internal server error" });
    });
});

module.exports = router;
