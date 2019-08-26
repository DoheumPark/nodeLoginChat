const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken');
const passport = require('passport');

const bkfd2Password = require('pbkdf2-password');
const hasher = bkfd2Password();

const mybatis = require('./dao/mybatis')
const final = require('./final')

const namespace = 'user'

router.post('/join', (req, res) => {
  const upw = req.body.upw
  if (upw === undefined || upw === '') {
    res.json(3)
    return
  }

  hasher({password: req.body.upw}, (err, pass, salt, hash) => {
    console.log(`err : ${err}`)
    console.log(`pass : ${pass}`)
    console.log(`salt : ${salt}`)
    console.log(`hash : ${hash}`)

    var param = {
      uid: req.body.uid,
      upw: hash,
      salt: salt,
      nick_nm: req.body.nick_nm
    }
    if(param.uid === undefined || param.uid === '') {
      res.json(2)
      return
    }

    mybatis.query(namespace, 'join', param).then(data => {
      for(var item in data) {
        console.log(`data[${item}] : ${data[item]}`)
      }
      res.json(data.affectedRows)
    }).catch(err => {
      res.json(0)
    })
    
  });
})

router.post('/login', (req, res, next) => {
    passport.authenticate("local", {session: false}, (err, user, info) => {
      if (err) {
        var result = next(err);
        console.log(`err result : ${result}`)
        return res.json({status: info.status})
      }
  
      if (!user) {
        console.log(`!user : ${user}`)
        return res.json({status: info.status, msg: '비'});
      }
  
      req.login(user, {session: false}, err => {
        if(err) {
          return res.json({status: 0});
        }
  
        const token = jwt.sign(user, final.SECRET_KEY);
        //DB에 token값 저장
        console.log('token : ' + token)
        return res.json({status: info.status, user, token});
      });
    })(req, res, next);
  });
  
  //로그아웃
  router.get('/logout', function(req, res) {
    req.logout();
    console.log("logged out")
    var result = res.send()
    console.log(`로그아웃 result : ${result}`)
    return result;
  });

  module.exports = router