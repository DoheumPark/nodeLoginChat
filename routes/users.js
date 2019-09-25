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

/* GET users listing. */
router.get('/myinfo', function(req, res) {
  
  console.log('req.user.name : ' + req.user.name);
  res.json('ddd')
});

module.exports = router;
