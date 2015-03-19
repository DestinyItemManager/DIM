$(document).ready(function(){
$.validator.setDefaults({
    highlight: function(element) {
      $(element).closest('.form-group').removeClass('has-success'); // remove the Boostrap error class from the control group
      $(element).closest('.form-group').addClass('has-error'); // add the Bootstrap error class to the control group
    },
    success: function(element) {
      element.text('OK!').addClass('has-success')
      element.closest('.form-group').removeClass('has-error'); // remove the Boostrap error class from the control group
      element.closest('.form-group').addClass('has-success'); // remove the Boostrap error class from the control group
    }
  });

  $('#newUserForm').validate({

    errorClass: "has-error",
    validClass: "has-success",
    rules: {
      name: {
        required:true
      },
      email: {
        required:true,
        email:true
      },
      encryptedPassword: {
        minlength: 6,
        required:true
      },
      confirmPassword: {
        minlength: 6,
        equalTo: "#NewUserPassword"
      }
    }
  });
});
