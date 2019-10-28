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

function logout(socket) { //로그아웃
  console.log('user logout!!');

  const param = {
    socket_id: socket.id
  }

  mybatis.query(namespace, 'delLoginUser', param)
  .then(data => {
    socket.broadcast.emit('somebodyLogout', socket.id)
  })
  .catch(err => {
    console.log('delLoginUser err : ' + err)
  })
}

async function quitRoom(data, socket) { //방나가기
  console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
  console.log('leaveChatRoom - i_chatroom : ' + data.i_chatroom)
  console.log('leaveChatRoom - i_user : ' + data.i_user)
  console.log('leaveChatRoom - socket.id : ' + socket.id)
  
  if(data.i_user == undefined) {
    return
  }

  socket.leave(data.i_chatroom)

  await mybatis.query(namespace, 'delChatRoomUser', data)

  if(io.sockets.adapter.rooms[data.i_chatroom] == undefined) { //DB에서 방 레코드 삭제
    mybatis.query(namespace, 'delChatRoom', data).then(result => {
      io.emit('destroyChatRoom', data.i_chatroom);
    }).catch(err => {
      console.log('delChatRoom err : ' + err)
    })
  } else {
    io.to(data.i_chatroom).emit('somebodyOut', data)
  }
}


io.on('connection', function(socket){
  console.log('connection!!!')

  socket.on('disconnect', async function() {
    console.log('disconnect : ' + socket.id)
    const param = {
      socket_id: socket.id
    }
    const result = await mybatis.query(namespace, 'getQuitRoomInfo', param)
    if(result != undefined && result.length > 0) {
      const data = {
        i_user: result[0].i_user,
        i_chatroom: result[0].i_chatroom
      }
      quitRoom(data, socket)
    }
    logout(socket)
  });

  socket.on('logout', async function() {
    logout(socket)
  })

  socket.on('login', async function(data) {
    console.log(' ------ login ---- ')
    console.log('data.i_user : ' + data.i_user)
    console.log('data.nick_nm : ' + data.nick_nm)

    const param = {
      i_user: data.i_user,
      nick_nm: data.nick_nm,
      socket_id: socket.id
    }

    mybatis.query(namespace, 'regLoginUser', param).then(result => {
      console.log('result : ' + result)
      socket.broadcast.emit('somebodyLogin', param)
    }).catch(err => {
      console.log('regLoginUser err : ' + err)
    })
  })

  //방 만들기
  socket.on('createChatRoom', function(data) {
    console.log('createChatRoom - data : ' + data.i_chatroom)
    socket.join(data.i_chatroom)
    socket.broadcast.emit('createChatRoom', data);
  })

  //방 입장
  socket.on('joinChatRoom', function(data) {

    const param = {
      i_user: data.i_user,
      nick_nm: data.nick_nm
    }
    io.to(data.i_chatroom).emit('somebodyJoin', param)

    console.log('joinChatRoom - data : ' + data.i_chatroom)
    socket.join(data.i_chatroom)
  })

  //방 나가기
  socket.on('leaveChatRoom', async function(data) {
    console.log('------------------ leaveChatRoom ---------')
    quitRoom(data, socket)
  })

  socket.on('sendMsg', function(data){
      console.log('i_chatroom: ' + data.i_chatroom);
      console.log('sended_nm: ' + data.sended_nm);
      console.log('content: ' + data.content);

      const param = {
        sended_nm: data.sended_nm,
        content: data.content
      }

      io.to(data.i_chatroom).emit('sendMsg', param)
  })

  socket.on('checkRoom', function(i_chatroom) {
    console.log(' -- checkRoom -- ')
    console.log(io.sockets.adapter.rooms[i_chatroom])
  })
})

// 접속된 모든 클라이언트에게 메시지를 전송한다
//io.emit('event_name', msg);

// 메시지를 전송한 클라이언트에게만 메시지를 전송한다
//socket.emit('event_name', msg);

// 메시지를 전송한 클라이언트를 제외한 모든 클라이언트에게 메시지를 전송한다
//socket.broadcast.emit('event_name', msg);

// 특정 클라이언트에게만 메시지를 전송한다
//io.to(id).emit('event_name', data);
