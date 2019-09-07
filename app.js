var createError = require('http-errors');

var express = require('express');

var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport');
require('./passport');

var flash = require('connect-flash');
var bodyParser = require("body-parser");
var auth = require('./auth')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);
app.use('/auth', auth);
app.use('/users', passport.authenticate('jwt', {session: false}), usersRouter);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const server = app.listen(8899, function() {
  console.log('서버 실행 완료!! port : 8899');
});

//-------------------------------------- IO
var io = require('socket.io')(server);

io.on('connection', function(socket){
  console.log('connection!!!');
})

io.on('test', function(socket) {
  
  console.log('test!!!');
  //console.log(socket)
})