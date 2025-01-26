const express = require("express");
const bcrypt = require('bcrypt');
const multer = require("multer");
let User = require(__dirname + "/../models/users.js");
let Patient = require(__dirname + "/../models/patient.js");
const { autenticacion, rol, accesoId } = require(__dirname + '/../auth/auth');

let router = express.Router();

let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

let upload = multer({ storage: storage });

//GET
router.get("/", autenticacion, rol(["admin", "physio"]), (req, res) => {
  Patient.find()
    .then((result) => {
      if (result.length > 0) res.render("patients_list", { patients: result });
      else res.render("error", { error: "No se ha encontrado pacientes en el sistema." }); 
    })
    .catch((error) => {
      res.render("error", { error: "Hubo un problema al procesar la búsqueda. Inténtelo más tarde." });
    });
});

//GET APELLIDOS
router.get("/find", autenticacion, rol(["admin", "physio"]), (req, res) => {
  Patient.find({
    surname: { $regex: req.query.surname, $options: "i" },
  })
    .then((result) => {
      if (result.length > 0) res.render("patients_list", { patients: result });
      else
        res.render("error", {
          error: "No se encontraron pacientes asociados al apellido ingresado.",
        });
    })
    .catch((error) => {
      res.render("error", { error: "Hubo un problema al procesar la búsqueda. Inténtelo más tarde." });
    });
});

//GET FORMULARIO NUEVO PACIENTE
router.get("/new", autenticacion, rol(["admin", "physio"]), (req, res) => {
  res.render("patient_add");
});

//GET FORMULARIO EDICIÓN PACIENTE
router.get("/:id/edit", autenticacion, rol(["admin", "physio"]), (req, res) => {
  Patient.findById(req.params.id).then(result => {
      const birthDateA = result.birthDate.toLocaleDateString('en-CA'); 
      res.render('patient_edit', { patient: result, birthDate: birthDateA });
  }).catch (error => {
      res.render('error', { error: "Hubo un problema al procesar la búsqueda. Inténtelo más tarde." });
  }); 
});

//GET ESPECÍFICO
router.get("/:id", autenticacion, rol(["admin", "physio", "patient"]), accesoId(), (req, res) => {
  Patient.findById(req.params.id)
    .then((result) => {
        const dateAux = result.birthDate.toLocaleDateString('es-ES');
        res.render("patient_detail", { patient: result, date: dateAux });
    })
    .catch((error) => {
      res.render("error", { error: "Hubo un problema al procesar la búsqueda. Inténtelo más tarde." });
    });
});

//POST NUEVO PACIENTE
router.post("/", autenticacion, rol(["admin", "physio"]), upload.single("image"), (req, res) => {
    let idUser;
    const saltRounds = 10;
    const hash = bcrypt.hashSync(req.body.password, saltRounds);

    let newUser = new User({
      login: req.body.login,
      password: hash,
      rol: "patient"
    });

    newUser.save().then((result) => {
      idUser = result._id;

      let patient = new Patient({
        _id: idUser,
        name: req.body.name,
        surname: req.body.surname,
        birthDate: req.body.birthDate,
        address: req.body.address,
        insuranceNumber: req.body.insuranceNumber,
      });

      if (req.file) {
        patient.image = req.file.filename;
      }

      patient.save().then(() => {
          res.redirect(req.baseUrl);
        })
        .catch(async (error) => {
          await User.findByIdAndDelete(idUser);

          let errores = {
            general: "Error añadiendo paciente",
          };

          if(error.code === 11000){ 
            if(error.keyPattern.insuranceNumber){ 
                errores.insuranceNumber = "El número de seguro debe ser único"; 
            }
          }
          else {
            if (error.errors.name) {
              errores.name = error.errors.name.message;
            }
            if (error.errors.surname) {
              errores.surname = error.errors.surname.message;
            }
            if (error.errors.birthDate) {
              errores.birthDate = error.errors.birthDate.message;
            }
            if (error.errors.address) {
              errores.address = error.errors.address.message;
            }
            if (error.errors.insuranceNumber) {
              errores.insuranceNumber = error.errors.insuranceNumber.message;
            }
          }
          res.render("patient_add", { error: errores, data: req.body });
        });
    }).catch((error) => {
    let errores = {
      general: "Error añadiendo usuario",
    };
    if(error.code === 11000){ 
      if(error.keyPattern.login)
          errores.login = "El nombre de usuario introducido ya existe"; 
    }
    else {
      if (error.errors.login) {
        errores.login = error.errors.login.message;
      }
      if (error.errors.password) {
        errores.password = error.errors.password.message;
      }
    }
    res.render("patient_add", { error: errores, data: req.body });
  });
});

//PUT PACIENTE
router.post("/:id", autenticacion, rol(["admin", "physio"]), upload.single("image"), (req, res) => {
  let newImage;
  if (req.file) {
    newImage = req.file.filename;
  }
  Patient.findByIdAndUpdate(req.params.id, {
      $set: {
        name: req.body.name,
        surname: req.body.surname,
        birthDate: req.body.birthDate,
        address: req.body.address,
        insuranceNumber: req.body.insuranceNumber,
        image: newImage
      }
    }, { new: true, runValidators: true }
  ).then((result) => {
        res.render("patient_detail", { patient: result });
    }).catch((error) => {
      let errores = {
        general: "Error editando paciente",
      };

      if(error.code === 11000){ 
        if(error.keyPattern.insuranceNumber){ 
            errores.insuranceNumber = "El número de seguro debe ser único"; 
        }
      }
      else {
        if (error.errors.name) {
          errores.name = error.errors.name.message;
        }
        if (error.errors.surname) {
          errores.surname = error.errors.surname.message;
        }
        if (error.errors.birthDate) {
          errores.birthDate = error.errors.birthDate.message;
        }
        if (error.errors.address) {
          errores.address = error.errors.address.message;
        }
        if (error.errors.insuranceNumber) {
          errores.insuranceNumber = error.errors.insuranceNumber.message;
        }
      }
      res.render("patient_edit", { error: errores, patient: {
        id: req.params.id, 
        name: req.body.name, 
        surname: req.body.surname, 
        address: req.body.address, 
        insuranceNumber: req.body.insuranceNumber
      }, birthDate: req.body.birthDate });
    });
});

//DELETE PATIENT
router.delete("/:id", autenticacion, rol(["admin", "physio"]), (req, res) => {
  Patient.findByIdAndDelete(req.params.id)
    .then((result) => {
        User.findByIdAndDelete(req.params.id).then((resultUser) => {
          res.redirect(req.baseUrl);
        });
    }).catch((error) => {
      res.render('error', {error: "El paciente a eliminar no existe"});
    });
});

module.exports = router;
