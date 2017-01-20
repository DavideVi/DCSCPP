var express = require('express');
var router = express.Router();

router.post('/session/new', function(req, res, next) {

  if (req.body.username === undefined) {
    return res.status(400).json({"error": "'username' has not been set"});
  }

  var username = req.body.username;
  var collection = req.db.get('sessions');

  collection.insert({
    "master": username,
    "tickets": [],
    "voting": false
  }, function (err, doc) {
    if (err) {
      return res.status(500).json({"status": "error", "message": "There was a problem creating a session"});
    }
    else {
      return res.json({"status": "ok", "session_id": doc._id });
    }
  });
});

router.post('/session/tickets/add', function(req, res, next) {

  if (req.body.session_id === undefined) {
    return res.status(400).json({"status": "error", "message": "'session_id' has not been set"});
  }
  if (req.body.ticket_body === undefined) {
    return res.status(400).json({"status": "error", "message": "'ticket_body' has not been set"});
  }

  var mongo = require('mongodb');
  var sessionid = new mongo.ObjectID(req.body.session_id);
  var ticket_body = req.body.ticket_body;

  var collection = req.db.get('sessions');

  collection.update(
    { _id: sessionid },
    { $push: { tickets: ticket_body } }
  , function (err, doc) {
    if (err) {
      return res.status(500).json({"status": "error", "message": "There was a problem adding a ticket"});
    }
    else {
      return res.json({"status": "ok"});
    }
  });
});

router.post('/session/tickets/set', function(req, res, next) {

    if (req.body.session_id === undefined) {
      return res.status(400).json({"status": "error", "message": "'session_id' has not been set"});
    }

    if (req.body.ticket_index === undefined) {
      return res.status(400).json({"status": "error", "message": "'ticket_index' has not been set"});
    }
    if (parseInt(req.body.ticket_index) < 0) {
      return res.status(400).json({"status": "error", "message": "'ticket_index' cannot be negative"});
    }

    var mongo = require('mongodb');
    var sessionid = new mongo.ObjectID(req.body.session_id);
    var ticket_index = parseInt(req.body.ticket_index);

    var collection = req.db.get('sessions');

    collection.col.aggregate(
      [
        {
          $match: {
            "_id": sessionid
          }
        },
        {
          $project: {
            numberOfTickets: { $size: "$tickets" }
          }
        }
      ],
      function(err, doc) {
        if (err) {
          return res.status(500).json({"status": "error", "message": "There was a problem setting the current ticket"});
        }
        else {
          if (doc[0].numberOfTickets <= ticket_index) {
            return res.status(400).json({"status": "error", "message": "`ticket_index` exceeds number of tickets (" + doc[0].numberOfTickets + ")"});
          }
          else {
              collection.update(
                { _id: sessionid },
                { $set: { current_index: ticket_index }},
                function (err, doc) {
                  if (err) {
                    return res.status(500).json({"status": "error", "message": "There was a problem setting the current ticket"});
                  }
                  else {
                    return res.json({"status": "ok"});
                  }
                }
              );
          }
        }
      }
    );


});

router.post('/session/vote/start', function(req, res, next) {

    if (req.body.session_id === undefined) {
      return res.status(400).json({"status": "error", "message": "'session_id' has not been set"});
    }

    var mongo = require('mongodb');
    var sessionid = new mongo.ObjectID(req.body.session_id);
    var ticket_body = req.body.ticket_body;

    var collection = req.db.get('sessions');

    collection.update(
      { _id: sessionid },
      { $set: { voting: true } }
    , function (err, doc) {
      if (err) {
        return res.status(500).json({"status": "error", "message": "There was a problem enabling voting for the current ticket"});
      }
      else {
        return res.json({"status": "ok"});
      }
    });
});

router.post('/session/vote/end', function(req, res, next) {

    if (req.body.session_id === undefined) {
      return res.status(400).json({"status": "error", "message": "'session_id' has not been set"});
    }

    var mongo = require('mongodb');
    var sessionid = new mongo.ObjectID(req.body.session_id);
    var ticket_body = req.body.ticket_body;

    var collection = req.db.get('sessions');

    collection.update(
      { _id: sessionid },
      { $set: { voting: false } }
    , function (err, doc) {
      if (err) {
        return res.status(500).json({"status": "error", "message": "There was a problem disabling voting for the current ticket"});
      }
      else {
        return res.json({"status": "ok"});
      }
    });

});

router.post('/session/vote/submit', function(req, res, next) {

    if (req.body.session_id === undefined) {
      return res.status(400).json({"status": "error", "message": "'session_id' has not been set"});
    }

});

router.get('/session/refresh', function(req, res, next) {

    if (req.body.session_id === undefined) {
      return res.status(400).json({"status": "error", "message": "'session_id' has not been set"});
    }

});


module.exports = router;
