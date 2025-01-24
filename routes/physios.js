const express = require("express");
const bcrypt = require('bcrypt');
const multer = require("multer");
let Physio = require(__dirname + "/../models/physio.js");
let User = require(__dirname + "/../models/users.js");
const { autenticacion, rol } = require(__dirname + '/../auth/auth');

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
router.get("/", autenticacion, (req, res) => {
  Physio.find()
    .then((result) => {
      if (result.length > 0) res.render("physios_list", { physios: result });
      else res.render("error", { error: "No se ha encontrado fisioterapeutas en el sistema." });
    })
    .catch((error) => {
      res.render("error", { error: "Hubo un problema al procesar la búsqueda. Inténtalo más tarde." });
    });
});

//GET FORMULARIO NUEVO FISIO
router.get("/new", autenticacion, rol(["admin"]), (req, res) => {
  res.render("physios_add");
});

//GET FORMULARIO EDICIÓN FISIO
router.get("/:id/edit", autenticacion, rol(["admin"]), (req, res) => {
  Physio.findById(req.params.id).then(result => {
        res.render('physio_edit', { physio: result });
  }).catch (error => {
      res.render('error', { error: "Hubo un problema al procesar la búsqueda. Inténtalo más tarde." });
  }); 
});

//GET ESPECIALIDAD
router.get("/find", autenticacion, (req, res) => {
  Physio.find({ specialty: req.query.specialty })
    .then((result) => {
      if (result.length > 0) res.render("physios_list", { physios: result });
      else
        res.render("error", {
          error: "No se encontraron fisioterapeutas con la especialidad indicada.",
        });
    })
    .catch((error) => {
      res.render("error", { error: "Hubo un problema al procesar la búsqueda. Inténtalo más tarde." });
    });
});

//GET ESPECÍFICO
router.get("/:id", autenticacion, (req, res) => {
  Physio.findById(req.params.id)
    .then((result) => {
      res.render("physio_detail", { physio: result });
    }).catch((error) => {
      res.render("error", { error: "Hubo un problema al procesar la búsqueda. Inténtalo más tarde." });
    });
});

//POST FISIO
router.post("/", autenticacion, rol(["admin"]), upload.single("image"), (req, res) => {
  let idUser;
  const saltRounds = 10;
  const hash = bcrypt.hashSync(req.body.password, saltRounds);

  let newUser = new User({
    login: req.body.login,
    password: hash,
    rol: "physio",
  });

  newUser.save().then((result) => {
      idUser = result._id;

      let physio = new Physio({
        _id: idUser,
        name: req.body.name,
        surname: req.body.surname,
        specialty: req.body.specialty,
        licenseNumber: req.body.licenseNumber,
      });

      if (req.file) {
        physio.image = req.file.filename;
      }

      physio.save().then(() => {
          res.redirect(req.baseUrl);
        })
        .catch(async (error) => {
          await User.findByIdAndDelete(idUser);

          let errores = {
            general: "Error añadiendo fisioterapeuta",
          };

          if(error.code === 11000){ 
            if(error.keyPattern.licenseNumber){ 
                errores.licenseNumber = "El número de licencia debe ser único"; 
            }
          }
          else {
            if (error.errors.name) {
              errores.name = error.errors.name.message;
            }
            if (error.errors.surname) {
              errores.surname = error.errors.surname.message;
            }
            if (error.errors.specialty) {
              errores.specialty = error.errors.specialty.message;
            }
            if (error.errors.licenseNumber) {
              errores.licenseNumber = error.errors.licenseNumber.message;
            }
          }
          res.render("physios_add", { error: errores, data: req.body });
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
      res.render("physios_add", { error: errores, data: req.body });
    });
});

//PUT FISIO 
router.post("/:id", autenticacion, rol(["admin"]), upload.single("image"), (req, res) => {
  let newImage, newSpecialty;
  if (req.file) {
    newImage = req.file.filename;
  }
  if(req.body.specialty){
    newSpecialty = req.body.specialty;
  }

  Physio.findByIdAndUpdate(req.params.id, {
      $set: {
        name: req.body.name,
        surname: req.body.surname,
        specialty: newSpecialty,
        licenseNumber: req.body.licenseNumber,
        image: newImage
      },
    }, { new: true, runValidators: true }
  ).then((result) => {
    res.render("physio_detail", { physio: result });
  }).catch((error) => {
    let errores = {
      general: "Error editando fisioterapeuta"
    }

    if(error.code === 11000){ 
      if(error.keyPattern.licenseNumber){ 
          errores.licenseNumber = "El número de licencia debe ser único"; 
      }
    }
    else {
      if (error.errors.name) {
        errores.name = error.errors.name.message;
      }
      if (error.errors.surname) {
        errores.surname = error.errors.surname.message;
      }
      if (error.errors.specialty) {
        errores.specialty = error.errors.specialty.message;
      }
      if (error.errors.licenseNumber) {
        errores.licenseNumber = error.errors.licenseNumber.message;
      }
    }
    res.render("physio_edit", { error: errores, physio: {
      id: req.params.id, 
      name: req.body.name, 
      surname: req.body.surname, 
      specialty: req.body.specialty, 
      licenseNumber: req.body.licenseNumber
    } });
  });
});

//DELETE FISIO
router.delete("/:id", autenticacion, rol(["admin"]), (req, res) => {
  Physio.findByIdAndDelete(req.params.id)
    .then((result) => {
        User.findByIdAndDelete(req.params.id).then((resultUser) => {
          res.redirect(req.baseUrl);
        });
    })
    .catch((error) => {
      res.render('error', {error: "El fisioterapeuta a eliminar no existe"});
    });
});

module.exports = router;
