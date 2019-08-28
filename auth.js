const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken');
const passport = require('passport');

const bkfd2Password = require('pbkdf2-password');
const hasher = bkfd2Password();

const mybatis = require('./dao/mybatis')
const final = require('./final')

const namespace = 'user'
const timePossibleWait = 900000

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

router.post('/login', async (req, res, next) => {
    passport.authenticate("local", {session: false}, async (err, user, info) => {
      if (err) {
        var result = next(err);
        console.log(`err result : ${result}`)
        return res.json({status: info.status})
      }
  
      if (!user) {
        console.log(`!user : ${user}`)
        return res.json({status: info.status});
      }
  
      req.login(user, {session: false}, async err => {
        if(err) {
          return res.json({status: 0});
        }
        
        //토큰 발행
        const token = jwt.sign(user, final.SECRET_KEY);

        //i_user값으로 등록된 token이 있는지 확인
        let param = {
          i_user: user.i_user,
          token: token
        }

        const tokenResult = await mybatis.query(namespace, 'getToken', param)
        if(tokenResult.length == 0) {
          await mybatis.query(namespace, 'regToken', param)

        } else {
          const tokenData = tokenResult[0]
          const useDatetime = new Date(tokenData.use_datetime) //마지막 사용시간
          const now = new Date(); //현재시간
          const gap = now.getTime() - useDatetime.getTime()

          if(gap > timePossibleWait) { //마지막 사용 후 15분 경과
            await mybatis.query(namespace, 'modToken', param)
          } else {
            console.log('다중 로그인 시도')
            return res.json({status: 3})
          }
        }

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