var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/myinfo', function(req, res) {
  
  console.log('req.user.name : ' + req.user.name);
  res.json('ddd')
});

module.exports = router;
