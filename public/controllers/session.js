
$(document).ready(function() {

  $("#addTicket").click(function() {
    var ticket_body = $("#ticket-body-field").val();
    $.post("/api/ticket/add", { session: session_id, ticket: ticket_body }, function(data, status, xhr) {
      if (status === "success") {
          console.log("Ticket added");
      }
      else {
        console.log("Could not add ticket");
        console.log(status);
        console.log(data);
      }
    });
  }); // #addTicket click

});
