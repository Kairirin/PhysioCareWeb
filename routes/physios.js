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
      if (result) res.render("physios_list", { physios: result });
      else res.render("error", { error: "No hay fisios en el sistema" });
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
    if(result)
        res.render('physio_edit', { physio: result });
    else
        res.render('error', { error: "No se ha encontrado el fisioterapeuta a editar" });
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
          error: "No se encontraron fisioterapeutas con la especialidad indicada",
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
      if (result) res.render("physio_detail", { physio: result });
      else res.render("error", { error: "No se ha encontrado el fisio" });
    })
    .catch((error) => {
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
        .catch((error) => {
          User.findByIdAndDelete(idUser); //TODO: Si no va, poner and remove

          let errores = {
            general: "Error adding physio",
          };

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
            errores.licenseNumber = error.errors.licenseNumber.message; //TODO: manualmente controlar que no se repita
          }
          res.render("physios_add", { error: errores, data: req.body });
        });
    })
    .catch((error) => {
      let username = User.find({ login: req.body.login });
      let errores = {
        general: "Error adding user",
      };
      if (username) {
        errores.unique = "This username is already in use";
      } else if (error.errors.login) {
        //TODO: Toda esta parte no va.
        errores.login = error.errors.login.message;
      }

      if (error.errors.password) {
        errores.password = error.errors.password.message;
      }
      res.render("physios_add", { error: errores, data: req.body });
    });
});

//PUT FISIO //TODO: Hace cosas raras
router.post("/:id", autenticacion, rol(["admin"]), upload.single("image"), (req, res) => {
  let newImage;
  if (req.file) {
    newImage = req.file.filename;
  }

  Physio.findByIdAndUpdate(req.params.id, {
      $set: {
        name: req.body.name,
        surname: req.body.surname,
        specialty: req.body.specialty,
        licenseNumber: req.body.licenseNumber,
        image: newImage
      },
    }, { new: true, runValidators: true }
  ).then((result) => {
    res.render("physio_detail", { physio: result });
  }).catch((error) => {
    let errores = {
      general: "Error editing physio"
    }
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
      errores.licenseNumber = error.errors.licenseNumber.message; //TODO: manualmente controlar que no se repita
    }
    res.render("physio_edit", { error: errores, physio: req.body });
  });
});

//DELETE FISIO
router.delete("/:id", autenticacion, rol(["admin"]), (req, res) => {
  Physio.findByIdAndDelete(req.params.id)
    .then((result) => {
      if (result) {
        User.findByIdAndDelete(req.params.id).then((resultUser) => {
          res.redirect(req.baseUrl);
        });
      } else 
        res.render('error', {error: "El fisio a eliminar no existe"});
    })
    .catch((error) => {
      res.render('error', {error: "El fisio a eliminar no existe"});
    });
});

module.exports = router;
