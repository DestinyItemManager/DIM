<?php
 session_start();

 $method = $_SERVER['REQUEST_METHOD'];
 $message = '';

 if ($method === 'POST') {
  // Check the CSRF token
  $token = $_SESSION['csrf_token'];
  // Clear the token from session
  if (strlen($token) > 1 && $_POST['token'] === $token) {
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Clear-Site-Data
    header('Clear-Site-Data: "*"');

    // Set the success message
    $message = 'Requested that your browser delete all DIM data.';
  } else {
    $message = 'CSRF token validation failed! token:' . $token . " posted:" . $_POST['token'];
  }
 }

 // Always generate a new token on page view
 $token = md5(random_bytes(32));
 $_SESSION['csrf_token'] = $token;

 session_write_close();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DIM NUKE</title>
  <style>
    body {
      font-family: sans-serif;
      background-color: black;
      color: white;
    }
  </style>
</head>
<body>
  <h1>Nuke DIM Data</h1>
  <?php if ($message) { ?>
    <p><b><?php echo $message; ?></b></p>
  <?php } ?>
  <form method="post" action="">
    <input type="hidden" name="token" value="<?php echo $token; ?>" />
    <p>This will delete all saved DIM data from this browser. If you did not have DIM Sync set up, you could lose settings, loadouts, and tags. If you do have DIM Sync set up, and it has been running successfully, you won't lose anything.</p>
    <p><b>This does not do anything in Safari or any iOS browser. It may not do as much as you hope in Firefox.</b></p>
    <button type="submit">NUKE IT</button>
  </form>
</body>
</html>