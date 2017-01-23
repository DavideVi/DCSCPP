
$(document).ready(function() {

  $("#newSession").click(function() {

    var username = $("#scrumMasterName").val();

    // Creating new session
    $.post("/api/session/new",
      { username: username },
      function(data, status, xhr) {
        if (status === "success") {
          // Redirecting user to session
          if (data.status === "ok") {
            var session_id = data.session_id;
            window.location.href = "/session/" + session_id + "/" + username;
          }
        }
      });


  }); // #newSession click

  $("#joinSession").click(function() {

    var username = $("#username").val();
    var session_id = $("#sessionID").val();

    // Checking if session exists
    $.post("/api/session/exists",
      {session_id : session_id},
      function(data, status, xhr) {
        if (status === "success") {
          if (data.status === "ok") {
            if (data.exists === true) {

              // Joining session
              $.post("/api/session/join",
              {session_id: session_id, username: username},
              function(data, status, xhr) {
                if (status === "success") {
                  if (data.status === "ok") {
                    window.location.href = "/session/" + session_id + "/" + username;
                  }
                }
              });

            }
            else {
              alert("Session " + session_id + " does not exist");
            }
          }
        }
      });

  }); // #joinSession click

});
