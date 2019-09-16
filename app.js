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

const mybatis = require('./dao/mybatis')
const namespace = 'user'

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
  console.log('connection!!!')

  socket.on('login', async function(data) {
    console.log(' ------ login ---- ')
    console.log('data.i_user : ' + data.i_user)
    console.log('data.nick_nm : ' + data.nick_nm)
    
    
    socket.loginUser = data

    io.clients((error, clients) => {
      console.log('clients : ' + clients)
    })

    const param = {
      i_user: data.i_user,
      nick_nm: data.nick_nm,
      socket_id: socket.id
    }

    await mybatis.query(namespace, 'delLoginUser', param).catch(err => {
      console.log('delLoginUser err : ' + err)
    })
    mybatis.query(namespace, 'regLoginUser', param).then(result => {
      console.log('result : ' + result)
      socket.broadcast.emit('somebodyLogin', data)
    }).catch(err => {
      console.log('regLoginUser err : ' + err)
    })
  })

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  
  socket.on('chatMessage', function(msg){
      console.log('message: ' + msg);
      io.emit('chatMessage', msg);
  });
})

// 접속된 모든 클라이언트에게 메시지를 전송한다
//io.emit('event_name', msg);

// 메시지를 전송한 클라이언트에게만 메시지를 전송한다
//socket.emit('event_name', msg);

// 메시지를 전송한 클라이언트를 제외한 모든 클라이언트에게 메시지를 전송한다
//socket.broadcast.emit('event_name', msg);

// 특정 클라이언트에게만 메시지를 전송한다
//io.to(id).emit('event_name', data);

io.on('test', function(socket) {
  
  console.log('test!!!');
  //console.log(socket)
})