<?php
function getLoginData() {
  $type = "";
  if (isset($_GET["code"])) {
    $type = "success";
  } else if (isset($_GET["error"])) {
    closeSession();
    $type = "error";
  } else if (isset($_POST["state"]) && sizeof($_GET) == 0) {
    $type = "auth";
  } else {
    $type = "unknown";
    closeSession();
  }
  return $type;
}

function closeSession() {
  // session_start();
  // session_unset();
  // session_destroy();
  // session_write_close();
  // setcookie(session_name(),'',0,'/');
  // echo "hello";
}

function storeDataInSession($type) {
  session_start();
  foreach ($_GET as $tag => $value) {
    if ($tag == "code") {
      $state = $_GET['state'];
      $_SESSION[$state] = $value;
    } else if ($tag != "state") {
      $_SESSION[$tag] = $value;
    }
  }
  $_SESSION["type"] = $type;
}

function authenticate() {
  session_start();
  $state = $_GET['state'];
  if (isset($_SESSION[$state])) {
    header('Content-Type: application/json');
    $_SESSION["authenticated"] = $type;
    echo json_encode($_SESSION);
  }
}

function main() {
  $type = getLoginData();
  if ($type == "auth") {
    authenticate();
  } else if ($type == "unknown") {
    header('HTTP/1.0 403 Forbidden');
  } else {
    storeDataInSession($type);
    echo "<script>window.close();</script>";
  }
}
main();
?>