var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index', { title: 'DCSC Poker Planning' });
});

router.get('/session/:session/:username', function(req, res, next) {

    var sessionid = req.params.session;
    var username = req.params.username;

    res.render('session', { username: username, session: sessionid });
});


module.exports = router;
