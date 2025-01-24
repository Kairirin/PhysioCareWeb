const mongoose = require('mongoose');

let appointmentSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: [true, 'La fecha es obligatoria']
    },
    physio: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'physios',
        required: [true, 'Debes indicar fisioterapeuta']
    },
    diagnosis: {
        type: String,
        required: [true, 'El diagnóstico es obligatorio'],
        minlength: [10, 'Longitud mínima: 10 caracteres'],
        maxlength: [500, 'Longitud máxima: 500 caracteres']
    },
    treatment: {
        type: String,
        required: [true, 'El tratamiento es obligatorio']
    },
    observations: {
        type: String,
        maxlength: [500, 'Longitud máxima: 500 caracteres']
    }
});

let recordSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'patients',
        required: [true, "Debes indicar paciente"],
        unique: true
    },
    medicalRecord: {
        type: String,
        maxlength: [1000, 'Longitud máxima: 1000 caracteres']
    },
    appointments: [appointmentSchema]
});

let Record = mongoose.model('records', recordSchema);
let Appointment = mongoose.model('appointments', appointmentSchema);
module.exports = { Record, Appointment };
