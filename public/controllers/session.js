
$(document).ready(function() {

    var enable_ticket_change = true;
    var current_ticket = -1; // Index of current ticket
    var init = false; // True if one-time checks have been made
    var enable_cards = false;

    // Initial data load when we load the page
    refreshSession();

    function refreshSession() {

      $.get("/api/session/refresh/" + session_id,
        function(data, status, xhr) {
          if (status === "success") {

            var info = data[0];

            // Updating current ticket index
            if (info.current_index !== undefined) {
              current_ticket = info.current_index;
            }

            // ================================================================
            // Disabling SCRUM master panels if we're not SCRUM master
            // ================================================================
            if (init === false) {
              if (info.master !== username) {
                // Yes we are, displying SCRUM master control panels
                $("#add-tickets-panel").html("");
                $("#scrum-control-panel").html("");
                init = true;
              }
            }

            // ================================================================
            // Loading all tickets
            // ================================================================
            $("#tickets-list").html("");
            for (var ticket_index in info.tickets) {
              var current_start = "";
              var current_end = "";
              if (ticket_index == current_ticket) {
                current_start = "<strong>";
                current_end = "</strong>";
              }
              $("#tickets-list").append("<li class='list-group-item'>"
                + "<span class='label label-default'>" + (parseInt(ticket_index) + 1) + "</span>"
                + current_start
                + info.tickets[ticket_index]
                + current_end
                + "</li>");
            }

            var state = undefined;

            if (info.voting === false && info.votes.length > 0) {
              state = 4;
            }
            else if (info.voting === true) {
              state = 3;
            }
            else if (info.current_index !== undefined) {
              state = 2;
            }
            else if (info.tickets.length === 0) {
              state = 0;
            }
            else if (info.tickets.length > 0) {
              state = 1;
            }

            if (state >= 2) {
                // Setting the question
                $("#question-label").html("<span class='label label-default pull-right'>"
                  + "Nr." + (info.current_index + 1) + "/" + info.tickets.length
                  + "</span>"
                  + info.tickets[info.current_index]);
            }

            // Changing UI elements according to session state
            switch (state) {
                // ================================================================
                // STATE 0 - Session just started, no tickets have been added,
                // voting started
                // ================================================================
                case 0:

                  enable_ticket_change = false;

                  var voteBtn = $("#vote-toggle");
                  voteBtn.prop('disabled', true);
                  voteBtn.removeClass('btn-danger');
                  voteBtn.addClass('btn-primary');
                  voteBtn.html("<span class='glyphicon glyphicon-play'></span> Start Voting");

                break;
                // ================================================================
                // STATE 1 - Session just started, tickets have been added,
                // voting not enabled, no ticket is set
                // ================================================================
                case 1:

                  enable_ticket_change = true;

                  var voteBtn = $("#vote-toggle");
                  voteBtn.prop('disabled', true);
                  voteBtn.removeClass('btn-danger');
                  voteBtn.addClass('btn-primary');
                  voteBtn.html("<span class='glyphicon glyphicon-play'></span> Start Voting");

                break;
                // ================================================================
                // STATE 2 - Session just started, tickets have been added,
                // voting not started, ticket has been set
                // ================================================================
                case 2:

                  enable_ticket_change = true;
                  enable_cards = false;

                  // A ticket has been set so now we should be able to vote
                  var voteBtn = $("#vote-toggle");
                  voteBtn.prop('disabled', false);
                  voteBtn.removeClass('btn-danger');
                  voteBtn.addClass('btn-primary');
                  voteBtn.html("<span class='glyphicon glyphicon-play'></span> Start Voting");

                  // Displaying users
                  $("#votes-area").html("");
                  for (var user_index in info.users) {
                    $("#votes-area").append("<div class='vote'>"
                      + "<div class='card'>?</div>"
                      + "<p>" + info.users[user_index] + "</p>");
                  }

                  // Updating information label for the users
                  $("#voting-area").removeClass('panel-primary');
                  $("#voting-area").addClass('panel-danger');
                  $("#vote-status-label").html("Wait for SCRUM master to enable voting");

                break;
                // ================================================================
                // STATE 3 - Session just started, tickets have been added,
                // ticket has been set, voting started
                // ================================================================
                case 3:

                  enable_ticket_change = false;
                  enable_cards = true;

                  // Vote button should
                  var voteBtn = $("#vote-toggle");
                  voteBtn.removeClass('btn-primary');
                  voteBtn.addClass('btn-danger');
                  voteBtn.html("<span class='glyphicon glyphicon-stop'></span> End Voting");

                  // Voting is now enabled so cards should be enabled
                  enable_cards = true;

                  // Displaying users and censored votes
                  $("#votes-area").html("");
                  voters = [];
                  for (var vote_index in info.votes) {
                    var card_color = "card-voted";
                    var card_content = "<span class='glyphicon glyphicon-ok'></span>";
                    if (info.votes[vote_index].username === username) {
                          card_color = "card-" + info.votes[vote_index].vote;
                          card_content = info.votes[vote_index].vote;
                    }
                    $("#votes-area").append("<div class='vote'>"
                      + "<div class='card " + card_color + "'>"
                      + card_content
                      + "</div>"
                      + "<p>" + info.votes[vote_index].username + "</p>");
                    voters.push(info.votes[vote_index].username);
                  }

                  for (var user_index in info.users) {
                    // Adding only users that haven't voted
                    if (voters.indexOf(info.users[user_index]) === -1) {
                      $("#votes-area").append("<div class='vote'>"
                        + "<div class='card'>?</div>"
                        + "<p>" + info.users[user_index] + "</p>");
                    }
                  }

                  // Updating information label for the users
                  $("#voting-area").removeClass('panel-danger');
                  $("#voting-area").addClass('panel-primary');
                  $("#vote-status-label").html("Voting enabled");

                break;
                // ================================================================
                // STATE 4 - Session just started, tickets have been added,
                // ticket has been set, voting just ended
                // ================================================================
                case 4:
                  enable_ticket_change = true;
                  enable_cards = false;

                  var voteBtn = $("#vote-toggle");
                  // voteBtn.prop('disabled', false);
                  voteBtn.removeClass('btn-danger');
                  voteBtn.addClass('btn-primary');
                  voteBtn.html("<span class='glyphicon glyphicon-play'></span> Start Voting");

                  // Displaying users and votes
                  $("#votes-area").html("");
                  voters = [];
                  for (var vote_index in info.votes) {
                    var card = info.votes[vote_index].vote;
                    $("#votes-area").append("<div class='vote'>"
                      + "<div class='card card-" + card + "'>"
                      + card
                      + "</div>"
                      + "<p>" + info.votes[vote_index].username + "</p>");
                    voters.push(info.votes[vote_index].username);
                  }

                  for (var user_index in info.users) {
                    // Adding only users that haven't voted
                    if (voters.indexOf(info.users[user_index]) === -1) {
                      $("#votes-area").append("<div class='vote'>"
                        + "<div class='card card-not-voted'><span class='glyphicon glyphicon-remove'></span></div>"
                        + "<p>" + info.users[user_index] + "</p>");
                    }
                  }

                  // Updating information label for the users
                  $("#voting-area").removeClass('panel-primary');
                  $("#voting-area").addClass('panel-danger');
                  $("#vote-status-label").html("Voting has ended. Wait for re-vote or next ticket");
                break;
                // ================================================================
                // NEXT STATE IS -2-
                // ================================================================
            }

            // =================================================================
            // Previous / Next button toggle
            // =================================================================
            // - Prevents out of bound indeces
            // - Updates current_ticket variable
            // - Disables changing tickets during vote
            if (enable_ticket_change) {

              if (current_ticket >= info.tickets.length - 1) {
                $("#next-ticket").prop('disabled', true);
              }
              else {
                $("#next-ticket").prop('disabled', false);
              }

              if (current_ticket <= 0) {
                $("#prev-ticket").prop('disabled', true);
              }
              else {
                $("#prev-ticket").prop('disabled', false);
              }
            }
            else {
              $("#next-ticket").prop('disabled', true);
              $("#prev-ticket").prop('disabled', true);
            }

          } // if status === "success"
        });

    }

    // Period check so we can sync the state of the game
    setInterval(refreshSession, 5000);

    // Add ticket functionality
    $("#btn-add-ticket").click(function() {
      submitTicket();
    });

    $("#ticket-body-field").keypress(function(event) {
    	var keycode = (event.keyCode ? event.keyCode : event.which);
    	if(keycode == '13'){
        submitTicket();
    	}
    });

    function submitTicket() {
      var ticket_body = $("#ticket-body-field").val();

      if (ticket_body.length < 5) {
        return;
      }

      $.post("/api/session/tickets/add",
        {session_id: session_id, ticket_body: ticket_body },
        function(data, status, xhr) {
          if (status === "success") {
            if (data.status === "ok") {
              $("#ticket-body-field").val("");
              refreshSession();
            }
          }
        });
    }

    $("#vote-toggle").click(function() {

      var voteBtn = $("#vote-toggle");

      // ENABLE voting
      if (voteBtn.hasClass('btn-primary')) {

        $.post("/api/session/vote/start",
          {session_id: session_id},
          function(data, status, xhr) {
            if (status === "success") {
              if (data.status === "ok") {
                voteToggled(voteBtn);
              }
            }
          });
      }
      // DISABLE voting
      else if (voteBtn.hasClass('btn-danger')) {

        $.post("/api/session/vote/end",
          {session_id: session_id},
          function(data, status, xhr) {
            if (status === "success") {
              if (data.status === "ok") {
                voteToggled(voteBtn);
              }
            }
          });
      }

    });

    function voteToggled(voteBtn) {

      voteBtn.prop("disabled", true);

      refreshSession();

      // Preventing accidental double-click
      setTimeout(function() {
        voteBtn.prop("disabled", false);
      }, 5000);
    }

    $("#prev-ticket").click(function() {
      setTicket(current_ticket - 1);
    });

    $("#next-ticket").click(function() {
      setTicket(current_ticket + 1);
    });

    function setTicket(index) {
      $.post("/api/session/tickets/set",
        {session_id: session_id, ticket_index: index },
        function(data, status, xhr) {
            if (status === "success") {
              if (data.status === "ok") {
                refreshSession();
              }
            }
        });
    }

    $(".vote-card").click(function(event) {
      if (enable_cards) {
        var card_label = $(event.target).html();

        $.post("/api/session/vote/submit",
          {session_id: session_id, ticket_index: current_ticket, vote: card_label, username: username },
          function(data, status, xhr) {
            if (status === "success") {
              if (data.status === "ok") {
                // voted
                refreshSession();
              }
            }
          });
      }
    });
});
