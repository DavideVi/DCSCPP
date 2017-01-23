
$(document).ready(function() {

    current_ticket = 0; // Index of current ticket
    init = false; // True if one-time checks have been made
    refreshSession();

    function refreshSession() {
      console.log("Refreshing session");

      $.get("/api/session/refresh/" + session_id,
        function(data, status, xhr) {
          if (status === "success") {

            var info = data[0];

            // Checking if we're the scrum master
            if (init === false) {
              if (info.master !== username) {
                // Yes we are, displying SCRUM master control panels
                $("#add-tickets-panel").html("");
                $("#scrum-control-panel").html("");
                init = true;
              }
            }

            // Loading all tickets
            $("#tickets-list").html("");
            for (var ticket_index in info.tickets) {
              $("#tickets-list").append("<li class='list-group-item'>"
                + info.tickets[ticket_index]
                + "</li>");
            }

            // No votes? Load users from 'users'
            if (info.votes.length === 0) {

              var voteBtn = $("#vote-toggle");
              voteBtn.removeClass('btn-danger');
              voteBtn.addClass('btn-primary');
              voteBtn.html("<span class='glyphicon glyphicon-play'></span> Start Voting");

                $("#votes-area").html("");
                for (var user_index in info.users) {
                  $("#votes-area").append("<div class='vote'>"
                    + "<div class='card'>?</div>"
                    + "<p>" + info.users[user_index] + "</p>");
                }

                $("#vote-status-label").removeClass('label-primary');
                $("#vote-status-label").addClass('label-danger');
                $("#vote-status-label").html("Wait for SCRUM master to enable voting");
            }
            // Voting? Display those that submitted and those that haven't
            else if (info.voting === true) {

                var voteBtn = $("#vote-toggle");
                voteBtn.removeClass('btn-primary');
                voteBtn.addClass('btn-danger');
                voteBtn.html("<span class='glyphicon glyphicon-stop'></span> End Voting");

                $("#votes-area").html("");
                voters = [];
                for (var vote_index in info.votes) {
                  $("#votes-area").append("<div class='vote'>"
                    + "<div class='card'>"
                    + "<span class='glyphicon glyphicon-ok'></span>"
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

                $("#vote-status-label").removeClass('label-danger');
                $("#vote-status-label").addClass('label-primary');
                $("#vote-status-label").html("Voting enabled");
            }
            else {

              var voteBtn = $("#vote-toggle");
              voteBtn.removeClass('btn-danger');
              voteBtn.addClass('btn-primary');
              voteBtn.html("<span class='glyphicon glyphicon-play'></span> Start Voting");

              $("#votes-area").html("");
              for (var vote_index in info.votes) {
                $("#votes-area").append("<div class='vote'>"
                  + "<div class='card'>" + info.votes[vote_index].vote + "</div>"
                  + "<p>" + info.votes[vote_index].username + "</p>");
              }

              $("#vote-status-label").removeClass('label-primary');
              $("#vote-status-label").addClass('label-danger');
              $("#vote-status-label").html("Voting finished, wait for next ticket");
            }
          }
        });

    }

    // Period check so we can sync the state of the game
    setInterval(refreshSession, 5000);

    // Add ticket functionality
    $("#btn-add-ticket").click(function() {

      var ticket_body = $("#ticket-body-field").val();

      $.post("/api/session/tickets/add",
        {session_id: session_id, ticket_body: ticket_body },
        function(data, status, xhr) {
          if (status === "success") {
            if (data.status === "ok") {
              refreshSession();
            }
          }
        });

    });

    $("#vote-toggle").click(function() {

      var voteBtn = $("#vote-toggle");

      // ENABLE voting
      if (voteBtn.hasClass('btn-primary')) {

        $.post("/api/session/vote/start",
          {session_id: session_id},
          function(data, status, xhr) {
            if (status === "success") {
              if (data.status === "ok") {

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

              }
            }
          });
      }

      voteBtn.prop("disabled", true);

      // Preventing accidental double-click
      setTimeout(function() {
        voteBtn.prop("disabled", false);
      }, 10000);

      refreshSession();
    });
});
