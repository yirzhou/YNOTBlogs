/* global $ */ 
$(function(){
    //  Get the root absolute url of the site
  var fullUrl =  window.location.protocol + "//" + window.location.host + "/blogs/contact/send";
      
    $("#contactForm").submit(function(e){  
      e.preventDefault();
      var name = $("input#name").val();
      var email = $("input#email").val();
      var message = $("textarea#message").val();
      var firstName = name; // For Success/Failure Message
      // Check for white space in name for Success/Fail message
      if (firstName.indexOf(' ') >= 0) {
        firstName = name.split(' ').slice(0, -1).join(' ');
      }
                $.ajax({
                url: fullUrl,
                type: 'POST',
                data: {
                    name: name,
                    email: email,
                    message: message
                },
                cache: false,
                function() {
                  // Success message
                  $('#success').html("<div class='alert alert-success'>");
                  $('#success > .alert-success').html("<button type='button' class='close' data-dismiss='alert' aria-hidden='true'>&times;")
                    .append("</button>");
                  $('#success > .alert-success')
                    .append("<strong>Your message has been sent. </strong>");
                  $('#success > .alert-success')
                    .append('</div>');
                  //clear all fields
                  $('#contactForm').trigger("reset");
                },
                
                dataType: 'json'
            });
            $('#success').html("<div class='alert alert-success'>");
            $('#success > .alert-success').html("<button type='button' class='close' data-dismiss='alert' aria-hidden='true'>&times;")
            .append("</button>");
            $('#success > .alert-success')
            .append("<strong>Hello, " + firstName + "! Thanks for your message. Your message has been sent! </strong");
            $('#success > .alert-success')
            .append('</div>');
            //clear all fields
            $('#contactForm').trigger("reset");
    });
});
