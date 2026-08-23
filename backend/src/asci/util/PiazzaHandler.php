<?php
/**
 */
namespace asci\util;

/**
 * Piazza Handler Class
 *
 * @author Robbie Hott
 */

class PiazzaHandler {

  private function readPiazzaUploadFile($filename, $isJSON=true) {
    $file = null;
    if (isset($_FILES['piazzacontent']) && !(!isset($_FILES['piazzacontent']['error']) ||
      is_array($_FILES['piazzacontent']['error']))) {
      // Check $_FILES[$name]['error'] value.
      switch ($_FILES['piazzacontent']['error']) {
      case UPLOAD_ERR_OK:
        break;
      case UPLOAD_ERR_NO_FILE:
        throw new \asci\exceptions\ASCIUploadException("No file selected.");
      case UPLOAD_ERR_INI_SIZE:
      case UPLOAD_ERR_FORM_SIZE:
        throw new \asci\exceptions\ASCIUploadException("File exceeded the filesize limit.  Please contact us.");
      default:
        throw new \asci\exceptions\ASCIUploadException("An unknown error occurred in uploading the file");
      }

      // You should also check filesize here.
      if ($_FILES['piazzacontent']['size'] > \asci\Config::$MAX_UPLOAD_SIZE) {
        throw new \asci\exceptions\ASCIUploadException("File exceeded the filesize limit.  Please contact us.");
      }

      $finfo = new \finfo(FILEINFO_MIME_TYPE);
      if (false === $ext = array_search(
        $finfo->file($_FILES['piazzacontent']['tmp_name']),
        array(
          'zip' => 'application/zip'
        ),
        true
      )) {
        throw new \asci\exceptions\ASCIUploadException("Invalid upload file format: " .$finfo->file($_FILES['piazzacontent']['tmp_name']). ".  Please upload a ZIP file.");
      }

      $file = false; 

      $zip = new \ZipArchive;
      if ($zip->open($_FILES['piazzacontent']['tmp_name'], \ZipArchive::RDONLY) === true) {
        $file = $zip->getFromName($filename);
        if ($file === false)
          throw new \asci\exceptions\ASCIUploadException("Could not find Piazza course contents in zip.");
        $zip->close();
      } else {
        throw new \asci\exceptions\ASCIUploadException("Could not open Piazza zip file.");
      }
    } else {
      throw new \asci\exceptions\ASCIUploadException("An error occurred in uploading the file.");
    }


    if ($file === false)
      throw new \asci\exceptions\ASCIUploadException("An error occurred when uploading the file.");

    $fileContents = null;
    if ($isJSON) {
      $fileContents = json_decode($file, true);
      if ($fileContents === null)
        throw new \asci\exceptions\ASCIUploadException("An error occurred when decoding the Piazza course content.");

    } else {
      $fileContents = $file;
    }

    return $fileContents;
  }

  private function cleanUserId($email) {
    if ($email === null || strpos($email, "@") === false)
      return false;
    list($id, $domain) = explode("@", $email);
    return strtolower(trim($id));
  }

  public function parsePiazzaStats($participants = []) {

    $piazzaRaw = $this->readPiazzaUploadFile("users.json");

    $piazzaData = [];
    foreach($participants as $participant) {
      $piazzaData[strtolower($participant->getComputingId())] = [
        "user" => $participant,
        "stats" => [
          "days" => 0,
          "posts" => 0,
          "asks" => 0,
          "answers" => 0,
          "views" => 0
        ]];
    }

    foreach($piazzaRaw as $piazzaUser) {
      $userid = $this->cleanUserId($piazzaUser["email"] ?? null);
      if ($userid !== false && isset($piazzaData[$userid])) {
        $piazzaData[$userid]["stats"] = $piazzaUser;
      }
    }
    return $piazzaData;
  }

  public function parsePiazzaStream($participants = []) {

    $piazzaRaw = $this->readPiazzaUploadFile("contributions.csv", false);

    $piazzaData = [];

    $indexPart = [];
    // get participants indexed by computing id 
    foreach($participants as $participant) {
      $indexPart[strtolower($participant->getComputingId())] =  $participant;
    }
    
    // Open a temporary memory stream
    $handle = fopen('php://memory', 'r+');
    fwrite($handle, $piazzaRaw);
    rewind($handle);

    $header = null;
    while (($data = fgetcsv($handle, 0, ",")) !== false) {
      if ($header == null) {
        $header = $data;
      }
      
      if (count($data) != 11)
        continue; 
      $userid = $this->cleanUserId($data[9]);
      if ($userid !== false && isset($indexPart[$userid])) {
        array_push($piazzaData, [
          "post_no" => $data[1],
          "timestamp" => $data[3],
          "subject" => $data[6],
          "contents" => $data[5],
          "type" => $data[7],
          "endorsed" => strtolower(trim($data[10])) === "true",
          "user" => $indexPart[$userid]
        ]);
      }
    }
    fclose($handle);
    
    return $piazzaData;
  }
}
