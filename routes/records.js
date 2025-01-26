const express = require("express");
let { Record, Appointment } = require(__dirname + "/../models/record.js");
let Patient = require(__dirname + "/../models/patient.js");
let Physio = require(__dirname + "/../models/physio.js");
const { autenticacion, rol, accesoId } = require(__dirname + '/../auth/auth');

let router = express.Router();

//GET
router.get("/", autenticacion, rol(["admin", "physio"]), (req, res) => {
    Record.find()
        .populate("patient")
        .then((result) => {
            if(result.length > 0)
                res.render('records_list', {records: result});
            else 
                res.render('error', { error: "No se encontraron expedientes en el sistema" });
        })
        .catch((error) => {
            res.render('error', { error: "Hubo un problema al procesar la búsqueda. Inténtalo más tarde."});
        });
});

//GET FORMULARIO NUEVO RECORD
router.get("/new", autenticacion, rol(["admin", "physio"]), (req, res) => {
    res.render("record_add");
  });

  //GET FORMULARIO NUEVO APPOINTMENT
router.get("/:id/appointments/new", autenticacion, rol(["admin", "physio"]), (req, res) => {
    res.render("record_add_appointment", { data: {
      id: req.params.id
    }});
  });

//GET POR APELLIDO DE PACIENTE
router.get("/find", autenticacion, rol(["admin", "physio"]), (req, res) => {
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
router.get("/:id", autenticacion, rol(["admin", "physio", "patient"]), accesoId(), (req, res) => {
    Record.findOne({ patient: req.params.id })
        .populate("patient")
        .then((result) => {
          if(result)
            res.render('record_detail', { record: result });
          else  
            res.render('error', { error: "No existe el expediente de este paciente." });
        }).catch((error) => {
            res.render('error', { error: "Hubo un problema al procesar la búsqueda. Inténtalo más tarde."});
        });
});

//POST EXPEDIENTE
router.post("/", autenticacion, rol(["admin", "physio"]), (req, res) => {
    Patient.findOne({ insuranceNumber: req.body.patient })
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
                      if (error.errors.medicalRecord) {
                        errores.medicalRecord = error.errors.medicalRecord.message;
                      }
                      res.render("record_add", { error: errores, data: req.body });
                    });
            }
            else{
                let errores = {
                    general: "Error añadiendo expediente",
                    patient: "Introduce un paciente válido"
                  };
                res.render("record_add", { error: errores});
            }
        }).catch(error => {
            res.render("error", { error: "Hubo un problema al procesar la petición. Inténtelo de nuevo." });
        })
  });

//AÑADIR CONSULTAS A UN EXPEDIENTE (POR ID PACIENTE)
router.post('/:id/appointments', autenticacion, rol(["admin", "physio"]), (req, res) => {
    Physio.findOne({ licenseNumber: req.body.physio})
        .then((result) => {
            let appointment = new Appointment ({
                date: req.body.date,
                physio: result._id,
                diagnosis: req.body.diagnosis,
                treatment: req.body.treatment,
                observations: req.body.observations
            });

            appointment.validate().then((result) => {
              Record.findOneAndUpdate({patient: req.params.id},
                {
                    $push: { appointments: appointment } 
                }, { new: true, runValidators: true }
                ).populate("patient")
                .then((result) => {
                        res.render('record_detail', { record: result });
                })
            }).catch((error) => {
                let errores = {
                    general: "Error añadiendo consulta",
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
                  res.render("record_add_appointment", { error: errores, data: {
                    id: req.params.id,
                    date: req.body.date, 
                    physio: req.body.physio, 
                    diagnosis: req.body.diagnosis, 
                    treatment: req.body.treatment, 
                    observations: req.body.observations
                  } });
                });
        }).catch(() => {
            let errores = {
                general: "Error añadiendo consulta",
                physio: "Debe introducir un fisioterapeuta válido"
              };
            res.render("record_add_appointment", { error: errores, data: {
              id: req.params.id,
              date: req.body.date, 
              physio: req.body.physio, 
              diagnosis: req.body.diagnosis, 
              treatment: req.body.treatment, 
              observations: req.body.observations
            } });
        })
})

//DELETE (POR ID PACIENTE)
router.delete("/:id", autenticacion, rol(["admin", "physio"]), (req, res) => {
    Record.findOneAndDelete({patient: req.params.id})
      .then((result) => {
            res.redirect(req.baseUrl);
      }).catch((error) => {
        res.render('error', {error: "Error en la petición. Inténtalo más tarde"});
      });
  });

module.exports = router;