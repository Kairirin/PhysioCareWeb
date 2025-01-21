const express = require("express");
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
      if (result) res.render("patients_list", { patients: result });
      else res.render("error", { error: "No se han encontrado pacientes" }); //TODO: ARREGLAR QUE CUANDO NO ENCUENTRA PACIENTES NO PASA A LA VISTA DE ERROR, SINO QUE SACA EL LISTADO VACÍO
    })
    .catch((error) => {
      res.render("error", { error: "Internal Server Error" });
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
          error: "No se encontraron pacientes asociados al apellido ingresado",
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
    if(result)
        res.render('patient_edit', { patient: result });
    else
        res.render('error', { error: "Patient not found" });
  }).catch (error => {
      res.render('error', { error: "Internal server error" });
  }); 
});

//GET ESPECÍFICO
router.get("/:id", autenticacion, rol(["admin", "physio", "patient"]), accesoId(), (req, res) => {
  Patient.findById(req.params.id)
    .then((result) => {
      if (result){
        const dateAux = result.birthDate.toLocaleDateString('es-ES');
        res.render("patient_detail", { patient: result, date: dateAux });
      } 
      else res.render("error", { error: "No se ha encontrado el paciente" });
    })
    .catch((error) => {
      res.render("error", { error: "Internal Server Error" });
    });
});

//POST NUEVO PACIENTE
router.post("/", autenticacion, rol(["admin", "physio"]), upload.single("image"), (req, res) => {
    let idUser;

    let newUser = new User({
      login: req.body.login,
      password: req.body.password,
      rol: "patient",
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
        .catch((error) => {
          User.findByIdAndDelete(idUser);

          let errores = {
            general: "Error adding patient",
          };

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
          if (error.errors.insuranceNumber) { //TODO: manualmente controlar que no se repita
            errores.insuranceNumber = error.errors.insuranceNumber.message;
          }
          res.render("patient_add", { error: errores, data: req.body });
        });
    }).catch((error) => {
    let username = User.find({ login: req.body.login });
    let errores = {
      general: "Error adding user",
    };
    if (username){
      errores.unique = "This username is already in use";
    }
    else if (error.errors.login) { //TODO: Toda esta parte no va.
      errores.login = error.errors.login.message;
    }
    
    if (error.errors.password) {
      errores.password = error.errors.password.message;
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
    })
    .catch((error) => {
      let errores = {
        general: "Error editing patient",
      };

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
        errores.insuranceNumber = error.errors.insuranceNumber.message; //TODO: manualmente controlar que no se repita
      }
      res.render("patient_edit", { error: errores, patient: req.body }); //TODO: La segunda vez que da error redirige al formulario de añadir y no sé porqué
    });
});

//DELETE PATIENT //TODO: Falta implementar todos los borrar
router.delete("/:id", autenticacion, rol(["admin", "physio"]), (req, res) => {
  Patient.findByIdAndDelete(req.params.id)
    .then((result) => {
      if (result) {
        User.findByIdAndDelete(req.params.id).then((resultUser) => {
          res.redirect(req.baseUrl);
        });
      } else
        res.render('error', {error: "El paciente a eliminar no existe"});
    })
    .catch((error) => {
      res.render('error', {error: "El paciente a eliminar no existe"});
    });
});

module.exports = router;
