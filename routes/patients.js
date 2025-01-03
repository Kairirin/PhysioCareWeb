const express = require("express");
const bcrypt = require('bcrypt');
let User = require(__dirname + "/../models/users.js");
let Patient = require(__dirname + "/../models/patient.js");

let router = express.Router();

//GET
router.get("/", (req, res) => {
  Patient.find()
    .then((result) => {
      if (result) res.render('patients_list', { patients: result });
      else
        res.render('error', { error: 'No se han encontrado pacientes'});
    })
    .catch((error) => {
      res.render('error', { error: 'Internal Server Error'});
    });
});

//GET APELLIDOS
router.get("/find", (req, res) => {
  Patient.find({
    surname: { $regex: req.query.surname, $options: "i" },
  })
    .then((result) => {
      if (result) res.render('patients_list', { patients: result });
      else
        res.render('error', { error: 'No se han encontrado pacientes con esos criterios'});
    })
    .catch((error) => {
      res.render('error', { error: 'Internal Server Error'});
    });
});

//GET ESPECÍFICO
router.get("/:id", (req, res) => {
    Patient.findById(req.params.id)
      .then((result) => {
        if (result) res.render('patient_detail', { patient: result });
        else
        res.render('error', { error: 'No se ha encontrado el paciente'});
      })
      .catch((error) => {
        res.render('error', { error: 'Internal Server Error'});
      });
  }
);

//POST PACIENTE
router.post("/", (req, res) => {
  let idUser;
  const saltRounds = 10;
  const hash = bcrypt.hashSync(req.body.password, saltRounds);

  let newUser = new User({
    login: req.body.login,
    password: hash,
    rol: "patient",
  });

  newUser.save()
    .then((result) => {
      idUser = result._id;

      let patient = new Patient({
        _id: idUser,
        name: req.body.name,
        surname: req.body.surname,
        birthDate: req.body.birthDate,
        address: req.body.address,
        insuranceNumber: req.body.insuranceNumber,
      });
      patient
        .save()
        .then((result) => {
          res.status(201).send({ result: result });
        })
        .catch((error) => {
          res.status(400).send({ error: "Error guardando paciente" });
        });
    })
    .catch((error) => {
      res.status(400).send({ error: "Error guardando usuario" });
    });
});

//PUT PACIENTE
router.put("/:id", (req, res) => {
  Patient.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        name: req.body.name,
        surname: req.body.surname,
        birthDate: req.body.birthDate,
        /* birthDate: new Date(req.body.birthDate), */
        address: req.body.address,
        insuranceNumber: req.body.insuranceNumber,
      }
    },
    { new: true, runValidators: true }
  )
    .then((result) => {
      if (result) res.status(200).send({ result: result });
      else
        res.status(400).send({ error: "Error actualizando los datos del paciente" });
    })
    .catch((error) => {
      res.status(500).send({ error: "Internal server error" });
    });
});

//DELETE PATIENT
router.delete("/:id", (req, res) => {
  Patient.findByIdAndDelete(req.params.id)
    .then((result) => {
      if (result){
        User.findByIdAndDelete(req.params.id)
        .then((resultUser) => {
          res.status(200).send({ result: resultUser });
        });
      } 
      else
        res.status(404).send({ error: "El paciente a eliminar no existe" });
    })
    .catch((error) => {
      res.status(500).send({ error: "Internal server error" });
    });
});

module.exports = router;
