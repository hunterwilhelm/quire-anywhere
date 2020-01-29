<?php
function getLoginData() {
  $data = [];
  if (isset($_GET["state"])) {
    closeSession();
    $tags = [
      "code",
      "state",
      "host",
      "error",
      "error_description"
    ];
    foreach ($tags as $tag) {
      if (isset($_GET[$tag])) {
        $data[$tag] = $_GET[$tag];
      }
    }
  }
  return $data;
}

function closeSession() {
  session_start();
  session_unset();
  session_destroy();
  session_write_close();
  setcookie(session_name(),'',0,'/');
}

function storeDataInSession($data) {
  session_start();
  foreach ($data as $tag => $value) {
    if ($tag == "code") {
      $state = $data['state'];
      $_SESSION[$state] = $value;
    } else if ($tag != "state") {
      $_SESSION[$tag] = $value;
    }
  }
  var_dump($_SESSION);
}
function main() {
  $data = getLoginData();
  storeDataInSession($data);
}
main();



?>