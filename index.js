const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const nunjucks = require('nunjucks');
const methodOverride = require('method-override');

const auth = require(__dirname + '/routes/auth');
const patients = require(__dirname + '/routes/patients');
const physios = require(__dirname + '/routes/physios');
const records = require(__dirname + '/routes/records');

let app = express();

app.use(session({
  secret: process.env.SECRETO_SESIONES,
  resave: true,
  saveUninitialized: false
  }));

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

nunjucks.configure('views', {
  autoescape: true,
  express: app
});

app.set('view engine', 'njk');

mongoose.connect(process.env.DATABASE_URL)
  .then(() => {
    console.log('Successful connection to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/node_modules/bootstrap/dist'));
app.use('/public', express.static(__dirname + '/public'));
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
  let method = req.body._method;
  delete req.body._method;
  return method;
  }
}));
app.use('/auth', auth);
app.use('/patients', patients);
app.use('/physios', physios);
app.use('/records', records);

app.get('/', (req, res) => {
  res.redirect('/public/index.html'); //Acceso a la página príncipal de índice
  });

app.listen(process.env.PUERTO);

/* 
CREDENCIALES:
admin: admin0
contraseña: wiwi

physio: bestFisio
contraseña: wiwi

*/