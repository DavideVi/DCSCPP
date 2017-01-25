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
    "voting": false,
    "users": [],
    "votes": []
  }, function (err, doc) {
    if (err) {
      return res.status(500).json({"status": "error", "message": "There was a problem creating a session"});
    }
    else {
      return res.json({"status": "ok", "session_id": doc._id });
    }
  });
});

router.post('/session/exists', function(req, res, next) {

    if (req.body.session_id === undefined) {
      return res.status(400).json({"status": "error", "message": "'session_id' has not been set"});
    }

    var mongo = require('mongodb');
    var sessionid = new mongo.ObjectID(req.body.session_id);
    var collection = req.db.get('sessions');

    collection.find({
      _id: sessionid
    }, function(err, doc) {
      if (err) {
        return res.status(500).json({"status": "error", "message": "Could not check if session exists"});
      }
      else {
        if (doc.length === 0) {
          return res.json({"status": "ok", "exists": false});
        }
        else {
          return res.json({"status": "ok", "exists": true});
        }
      }
    });
});

router.post('/session/join', function(req, res, next) {

    if (req.body.session_id === undefined) {
      return res.status(400).json({"status": "error", "message": "'session_id' has not been set"});
    }
    if (req.body.username === undefined) {
      return res.status(400).json({"error": "'username' has not been set"});
    }

    var mongo = require('mongodb');
    var sessionid = new mongo.ObjectID(req.body.session_id);
    var username = req.body.username;
    var collection = req.db.get('sessions');

    collection.update({
      _id: sessionid
    }, {
      $push: { users: username }
    }, function(err, doc) {
      if (err) {
        return res.status(500).json({"status": "error", "message": "Could not join session"});
      }
      else {
          return res.json({"status": "ok"});
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

    collection.find({
      _id: sessionid,
      voting: true
    },
    function(err, doc) {
      if (err) {

      }
      else {
        if (doc.length > 0) {
          return res.status(409).json({"status": "error", "message": "Cannot change question while voting is enabled"});
        }
        else {

            // Removing all previous votes
            collection.update(
              { _id: sessionid },
              { $set: { votes: [] } },
              function(err, doc) {
                  if (err) {
                    return res.status(500).json({"status": "error", "message": "There was a problem setting the current ticket"});
                  }
                  else {

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
                      ); // collection.col.aggregate
                  } // else
              } // collection.update callback
            ); // collection.update
        }
      }
    });
});

router.post('/session/vote/start', function(req, res, next) {

    if (req.body.session_id === undefined) {
      return res.status(400).json({"status": "error", "message": "'session_id' has not been set"});
    }

    var mongo = require('mongodb');
    var sessionid = new mongo.ObjectID(req.body.session_id);
    var ticket_body = req.body.ticket_body;

    var collection = req.db.get('sessions');

    // Removing all previous votes
    collection.update(
      { _id: sessionid },
      { $set: { votes: [] } },
      function(err, doc) {
          if (err) {
            return res.status(500).json({"status": "error", "message": "There was a problem setting the current ticket"});
          }
          else {
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
    if (req.body.ticket_index === undefined) {
      return res.status(400).json({"status": "error", "message": "'ticket_index' has not been set"});
    }
    if (req.body.vote === undefined) {
      return res.status(400).json({"status": "error", "message": "'vote' has not been set"});
    }
    if (req.body.username === undefined) {
      return res.status(400).json({"status": "error", "message": "'username' has not been set"});
    }


    var mongo = require('mongodb');
    var sessionid = new mongo.ObjectID(req.body.session_id);
    var ticket_index = parseInt(req.body.ticket_index);
    var vote = req.body.vote;
    var username = req.body.username;

    // Checking if voting is enabled and if current index matches the
    // one the vote was submitted for
    var collection = req.db.get('sessions');

    // Making sure user had joined session and is voting for the right ticket
    collection.find({
      _id: sessionid,
      current_index: ticket_index,
      users: username
    }, function(err, doc) {
      if (err) {
        return res.status(500).json({"status": "error", "message": "There was a problem submitting the vote for the current ticket"});
      }
      else {
        if (doc.length === 0) {
          return res.status(400).json({"status": "error", "message": "'ticket_index' might not match `current_index` or you have not officially joined this session."});
        }
        else if (doc[0].voting === false) {
          return res.status(409).json({"status": "error", "message": "Cannot submit vote if voting has not been started"});
        }
        else {
          // Removing any existing votes
          collection.update({
              _id: sessionid,
              current_index: ticket_index
          },{
            $pull: {
              votes: {
                username: username,
              }
            }
          }, function(err, doc) {
            if (err) {
              return res.status(500).json({"status": "error", "message": "There was a problem submitting the vote for the current ticket"});
            }
            else {
              // Finally adding the vote
              collection.update({
                  _id: sessionid,
                  current_index: ticket_index
              },{
                $push: {
                  votes: {
                    username: username,
                    vote: vote
                  }
                }
              }, function(err, doc) {
                if (err) {
                  return res.status(500).json({"status": "error", "message": "There was a problem submitting the vote for the current ticket"});
                }
                else {
                  return res.json({"status": "ok"});
                }
              });
            }
          });
        } // else
      } // else
    }); // collection.find

});

router.get('/session/refresh/:session', function(req, res, next) {

    if (req.params.session === undefined) {
      return res.status(400).json({"status": "error", "message": "'session_id' has not been set"});
    }

    var mongo = require('mongodb');
    var sessionid = new mongo.ObjectID(req.params.session);
    var collection = req.db.get('sessions');

    collection.find({
      _id: sessionid,
    }, function(err, doc) {
      if (err) {
        return res.status(500).json({"status": "error", "message": "Could not refresh session status"});
      }
      else {
        return res.json(doc);
      }
    });
});


module.exports = router;
