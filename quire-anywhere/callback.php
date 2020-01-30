<?php
function getLoginType($postData) {
  $type = "";
  if (isset($_GET["code"])) {
    $type = "success";
  } else if (isset($_GET["error"])) {
    closeSession();
    $type = "error";
  } else if (isset($postData["state"]) && sizeof($_GET) == 0) {
    $type = "auth";
  } else {
    $type = "unknown";
    closeSession();
  }
  return $type;
}

function closeSession() {
  session_start();
  session_unset();
  session_destroy();
  session_write_close();
  setcookie(session_name(),'',0,'/');
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

function authenticate($postData) {
  session_start();
  $state = $postData['state'];
  if (isset($_SESSION[$state]) && 
      isset($_SESSION["type"]) && $_SESSION["type"] == "success") {
    $_SESSION["type"] = "authenticated";
    $sessionJson = json_encode($_SESSION);
    closeSession();
    header('Content-Type: application/json');
    echo $sessionJson;
  } else if (isset($_SESSION["type"]) && $_SESSION["type"] == "error") {
    $sessionJson = json_encode($_SESSION);
    closeSession();
    header('Content-Type: application/json');
    echo $sessionJson;
  } else {
    header('HTTP/1.0 403 Forbidden');
  }
}

function main() {
  $postData = json_decode(file_get_contents('php://input'), true);
  $type = getLoginType($postData);
  if ($type == "auth") {
    authenticate($postData);
  } else if ($type == "unknown") {
    header('HTTP/1.0 403 Forbidden');
  } else {
    storeDataInSession($type);
    echo "<script>window.close();</script>";
  }
}
main();
?>