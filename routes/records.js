const express = require("express");
let { Record, Appointment } = require(__dirname + "/../models/record.js");
let Patient = require(__dirname + "/../models/patient.js");
let Physio = require(__dirname + "/../models/physio.js");

let router = express.Router();

//GET
router.get("/", (req, res) => {
    Record.find()
        .populate("patient")
        .then((result) => {
            if(result)
                res.render('records_list', {records: result});
            else 
                res.render('error', { error: "No se encontraron expedientes en el sistema" });
        })
        .catch((error) => {
            res.render('error', { error: "Hubo un problema al procesar la búsqueda. Inténtalo más tarde."});
        });
});

//GET FORMULARIO NUEVO RECORD
router.get("/new", (req, res) => {
    res.render("record_add");
  });

  //GET FORMULARIO NUEVO APPOINTMENT
router.get("/:id/appointments/new", (req, res) => {
    res.render("record_add_appointment", { id: req.params.id});
  });

//GET POR APELLIDO DE PACIENTE
router.get("/find", (req, res) => {
    Patient.find({ surname: req.query.surname })
        .then(resultadoPaciente => {
            let idPacientes = resultadoPaciente.map(p => p.id);
            Record.find({patient: { $in: idPacientes }})
                .populate("patient")
                .then(result => {
                    if(result.length > 0)
                        res.render('records_list', {records: result});
                    else 
                        res.render('error', { error: "No se encontraron expedientes asociados al apellido ingresado" });
                })
        }).catch((error) => {
            res.render('error', { error: "Hubo un problema al procesar la búsqueda. Inténtelo más tarde"});
        });
});

//GET POR ID DE PACIENTE
router.get("/:id", (req, res) => {
    Record.findOne({patient: req.params.id})
        .populate("patient")
        .then(result => {
            if(result)
                res.render('record_detail', { record: result });
            else 
                res.render('error', { error: "No se ha encontrado el expediente" });
        }).catch((error) => {
            res.render('error', { error: "Hubo un problema al procesar la búsqueda. Inténtalo más tarde."});
        });
});

//POST EXPEDIENTE
router.post("/", (req, res) => {
    /* Patient.findById(req.body.patient) */
    Patient.findOne({insuranceNumber: req.body.patient })
        .then(result => {
            if(result){
                let record = new Record({
                    patient: result._id,
                    medicalRecord: req.body.medicalRecord,
                    appointments: []
                });
                record.save().then((result) => {
                    res.redirect(req.baseUrl);
                  })
                  .catch((error) => {
                    let errores = {
                        general: "Error añadiendo expediente",
                      };
            
                      if (error.errors.patient) {
                        /* errores.patient = error.errors.patient.message; */
                        errores.patient = "Debes añadir paciente";
                      }
                      if (error.errors.medicalRecord) {
                        errores.medicalRecord = error.errors.medicalRecord.message;
                      }
                      res.render("record_add", { error: errores, data: req.body });
                    });
            }
            else{
                let errores = {
                    general: "No se ha encontrado paciente con esa ID",
                  };
                res.render("record_add", { error: errores});
            }
        }).catch(error => {
            res.render("error", { error: "Error en la base de datos. Inténtelo de nuevo." });
        })
  });

//AÑADIR CONSULTAS A UN EXPEDIENTE (POR ID PACIENTE)
router.post('/:id/appointments', (req, res) => {
    Physio.findOne({ licenseNumber: req.body.physio})
        .then((result) => {
            let appointment = new Appointment ({
                /* date: new Date(req.body.date), */
                date: req.body.date,
                physio: result._id,
                diagnosis: req.body.diagnosis,
                treatment: req.body.treatment,
                observations: req.body.observations
            });
        
            Record.findOneAndUpdate({patient: req.params.id},
            {
                $push: {appointments: appointment} 
            }, { new: true }
            ).then(result => {
                if (result)
                    res.render('record_detail', { record: result });
                else
                    res.render("error", { error: "Error en inserción. Inténtelo de nuevo." }); //TODO: Comprobar si sobra
            }).catch((error) => {
                let errores = {
                    general: "Error adding appointment",
                  };
            
                  if (error.errors.date) {
                    errores.date = error.errors.date.message;
                  }
                  
                  if (error.errors.physio) {
                    errores.physio = error.errors.physio.message;
                  }

                  if (error.errors.diagnosis) {
                    errores.diagnosis = error.errors.diagnosis.message;
                  }
                  if (error.errors.treatment) {
                    errores.treatment = error.errors.treatment.message;
                  }
                  if (error.errors.observations) {
                    errores.observations = error.errors.observations.message;
                  }
                  res.render("record_add_appointment", { error: errores, data: req.body }); //TODO: La segunda vez que da error redirige al formulario de añadir y no sé porqué
                });
        }).catch(() => {
            let errores = {
                general: "Error adding appointment",
                physio: "El fisio  no existe"
              };
            res.render("record_add_appointment", { error: errores, data: req.body });
        })
})

//DELETE (POR ID PACIENTE)
router.delete("/:id", (req, res) => {
    Record.findOneAndDelete({patient: req.params.id})
      .then((result) => {
        if (result)
            res.redirect(req.baseUrl);
        else
            res.render('error', {error: "El expediente a eliminar no existe"});
      })
      .catch((error) => {
        res.render('error', {error: "Error en el servidor. Inténtalo más tarde"});
      });
  });

module.exports = router;