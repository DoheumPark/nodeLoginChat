const passport    = require('passport');
const passportJWT = require("passport-jwt");
const ExtractJWT = passportJWT.ExtractJwt;

const LocalStrategy = require('passport-local').Strategy;
const JWTStrategy   = passportJWT.Strategy;
const final = require('./final')

const bkfd2Password = require('pbkdf2-password');
const hasher = bkfd2Password();

const mybatis = require('./dao/mybatis')
const namespace = 'user'

//status
//0: 아이디 없음, 1: 로그인 성공, 2:비번 틀림
passport.use(new LocalStrategy({
    usernameField: 'uid',
    passwordField: 'upw',
    session: false
  }, async function (uid, upw, done) {
    console.log('------- LocalStrategy ----------')
    console.log(`uid : ${uid}, upw : ${upw}`)
    const params = {
      uid: uid
    } 
    const dbUser = await mybatis.query(namespace, 'getUser', params)
    console.log('dbUser : ' + dbUser)

    console.log("dbUser == '' : " + (dbUser == ''))
    console.log("dbUser == null : " + (dbUser == null))
    console.log("dbUser == undefined : " + (dbUser == undefined))


    if(dbUser == '') {
      return done(null, false, {status: 0, message: 'Incorrect id'})
    }
   
    const db = dbUser[0]
    hasher({password: upw, salt: db.salt}, (err, pass, salt, hash) => {
      console.log('db.salt : ' + db.salt)
      console.log('hash : ' + hash)
      console.log('db.upw : ' + db.upw)

      if(hash === db.upw) {
        console.log('비번 맞음!!!!')
        const user = {
          i_user: db.i_user,
          nick_nm : db.nick_nm
        }
        return done(null, user, {status: 1})

      } else {
        console.log('비번 틀림!!!!')
        return done(null, false, {status: 2, message: 'Incorrect password'})
      }
    })   
  })
); 
  
passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey   : final.SECRET_KEY
  }, function (jwtPayload, cb) {
  
    console.log(`jwtPayload.name : ${jwtPayload.name}`)
  
    var result = jwtPayload.name === 'hahaha'
  
    var user = {
      name: 'hahaha'
    }
  
   
      return cb(null, user)
    
  })
);