const session = require('express-session');
const User = require(__dirname + '/../models/users');

let autenticacion = (req, res, next) => {
    if (req.session && req.session.usuario)
        return next();
    else
        res.render('login');
};

let rol = (rol) => {
    return (req, res, next) => {
        if (rol.some(r => r == req.session.rol))
            next();
        else
            res.render('login');
    }
}

let accesoId = () => {
    return (req, res, next) => {
        if(req.session.login == "patient" && req.params.id != req.session.id)
            res.render('error', { error: "Acceso no autorizado" });
        else
            next();
   }
}

module.exports = {
    autenticacion: autenticacion,
    rol: rol,
    accesoId: accesoId
};