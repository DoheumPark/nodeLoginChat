const express = require('express');
const router = express.Router();
const mybatis = require('../dao/mybatis')
const namespace = 'user'

router.get('/getLoginUserList', async function(req, res) {
  const param = {
    i_user: req.user.i_user
  }

  mybatis.query(namespace, 'getLoginUserList', param).then(data => {
    res.json(data)
  }).catch(err => {
    res.json({})
    console.log('getLoginUserList - err : ' + err)
  })
})

router.post('/regChatRoom', async function(req, res) {
  
  const param = {
    title: req.body.title,
    maxmember: req.body.maxmember,
    createuser: req.user.i_user
  }

  if(param.maxmember < 2) {
    res.json(-1)
    return
  }

  const dbResult = await mybatis.query(namespace, 'regChatRoom', param)

  const param2 = {
    i_user: req.user.i_user,
    nick_nm: req.user.nick_nm,
    i_chatroom: dbResult.insertId
  }

  await regChatRoomUser(param2)

  res.json(dbResult.insertId)
});

router.get('/getChatRoomList', function(req, res) {
  mybatis.query(namespace, 'getChatRoomList').then(data => {
    res.json(data)
  }).catch(err => {
    res.json({})
    console.log('getChatRoomList - err : ' + err)
  })
})

router.post('/regChatRoomUser', async function(req, res) {
  const param = {
    i_user: req.user.i_user,
    nick_nm: req.user.nick_nm,
    i_chatroom: req.body.i_chatroom
  }
  const restCnt = await mybatis.query(namespace, 'getRoomRestMemberCnt', param) 

  if(restCnt[0].restCnt == 0) {
    res.json({state: 0})
  } else {
    const data = await regChatRoomUser(param)
    res.json({state: 1})
  }
})

async function regChatRoomUser(param) {
  return mybatis.query(namespace, 'regChatRoomUser', param).then(data => {
    return data
  }).catch(err => {
    console.log('regChatRoomUser - err : ' + err)
    return {}
  })
}

router.get('/getChatRoomUserList', async function(req, res) {
  const param = {
    i_chatroom: req.query['i_chatroom']
  }
  const result = await mybatis.query(namespace, 'getChatRoomUserList', param)
  res.json(result)
})
module.exports = router;
