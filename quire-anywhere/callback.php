<?php
include('app.config.php');
include("app.secret.php");
include("status.keys.php");

function getLoginType() {
  if (isset($_GET["code"])) {
    closeSession();
    if (isset($_GET["state"])) {
      return StatusKeys::ACCESS_CODE_RECEIVED;
    } else {
      return StatusKeys::REDIRECT_INSTALL_EXTENSION;
    }
  } else if (isset($_GET["error"])) {
    closeSession();
    return StatusKeys::ACCESS_CODE_DENIED;
  } else if (isset($_POST["state"]) && sizeof($_GET) == 0 && count($_POST) == 1) {
    return StatusKeys::QUIRE_DATA_REQUESTED;
  } else if (sizeof($_GET) == 0 && isset($_POST["grant_type"]) && isset($_POST["refresh_token"])) {
    return StatusKeys::REFRESH_REQUESTED;
  } else {
    closeSession();
    return StatusKeys::UNKNOWN;
  }
}

function closeSession() {
  if(session_id() != '') {
    startSession();
    session_unset();
    session_destroy();
    session_write_close();
    setcookie(session_name(), '', 0, '/');
  }
}

function startSession() {
  if(session_id() == ''){
    session_start();
  }
}

function storeQuireGetDataInSession($loginType) {
  startSession();
  foreach ($_GET as $tag => $value) {
    $_SESSION[$tag] = $value;
  }
  $_SESSION['status'] = $loginType;
  return $_SESSION;
}

function storeQuirePostDataInSession($loginType, $postData) {
  startSession();
  foreach ($postData as $tag => $value) {
    $_SESSION[$tag] = $value;
  }
  $_SESSION['status'] = $loginType;
}

function serveQuireDataAsJson() {
  startSession();
  $state = $_POST['state'];
  $validState = isset($_SESSION['state']) && $state === $_SESSION['state'];
  if ($validState) {
    unset($_SESSION['state']);
    $sessionJson = json_encode($_SESSION);
    closeSession();
    header('Content-Type: application/json');
    echo $sessionJson;
  } else {
    header('HTTP/1.0 403 Forbidden');
  }
}

function closeTheTab() {
   echo "<script>setTimeout(function(){window.close()}, 0);</script>";
}

function getToken($session_data) {
  $url = AppConfig::tokenUrl;
  $string_data =
      'code='. $session_data['code'] .
      '&grant_type=authorization_code' .
      '&client_id='.AppConfig::clientId .
      '&client_secret='.AppSecret::clientSecret;

  $resultJson = post($url, $string_data);
  if ($resultJson !== FALSE) {
    // var_dump($http_response_header);
    if (isJson($resultJson)) {
      $result = json_decode($resultJson, true);
      $statusKey = StatusKeys::UNKNOWN;
      if (isset($result['error'])) {
        $statusKey = StatusKeys::TOKEN_DENIED;
      } else if (isset($result['access_token'])) {
        $statusKey = StatusKeys::TOKEN_SUCCESS;
      }
      storeQuirePostDataInSession($statusKey, $result);
    }
  }
}

function refreshToken() {
  $url = AppConfig::tokenUrl;
  $string_data =
      'refresh_token='. $_POST['refresh_token'] .
      '&grant_type=refresh_token' .
      '&client_id='.AppConfig::clientId .
      '&client_secret='.AppSecret::clientSecret;

  $resultJson = post($url, $string_data);
  if (isJson($resultJson)) {
    $result = json_decode($resultJson, true);
    $statusKey = StatusKeys::UNKNOWN;
    if (isset($result['error'])) {
      $statusKey = StatusKeys::TOKEN_DENIED;
    } else if (isset($result['access_token'])) {
      $statusKey = StatusKeys::TOKEN_SUCCESS;
    }
    $result['status'] = $statusKey;
    $finalJson = json_encode($result);
    header('Content-Type: application/json');
    echo $finalJson;
  }
}

function isJson($string) {
  json_decode($string, true);
  return (json_last_error() == JSON_ERROR_NONE);
}

function post($url, $string_data) {
  $options = array(
      'http' => array(
          'method'  => 'POST',
          'content' => $string_data,
          'ignore_errors' => true,
      )
  );
  $context  = stream_context_create($options);
  return file_get_contents($url, false, $context);
}

function main() {
  $loginType = getLoginType();
  switch ($loginType) {
    case StatusKeys::QUIRE_DATA_REQUESTED:
      serveQuireDataAsJson();
      break;
    case StatusKeys::REFRESH_REQUESTED:
      refreshToken();
      break;
    case StatusKeys::ACCESS_CODE_RECEIVED:
      $session_data = storeQuireGetDataInSession($loginType);
      getToken($session_data);
      closeTheTab();
      break;
    case StatusKeys::ACCESS_CODE_DENIED:
      storeQuireGetDataInSession($loginType);
      closeTheTab();
      break;
    case StatusKeys::REDIRECT_INSTALL_EXTENSION:
      header('Location: http://zicy.net/quire-anywhere');
      break;
    // exceptions are caught here
    case StatusKeys::UNKNOWN:
    default:
      header('HTTP/1.0 403 Forbidden');
      break;
  }
}
main();
