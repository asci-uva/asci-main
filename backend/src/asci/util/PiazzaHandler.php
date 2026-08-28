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

    $indexPart = [];
    foreach($participants as $participant) {
      $indexPart[strtolower($participant->getComputingId())] = $participant;
    }

    $piazzaData = [];
    foreach($piazzaRaw as $piazzaUser) {
      $userid = $this->cleanUserId($piazzaUser["email"] ?? null);
      if ($userid !== false && isset($indexPart[$userid])) {
        $piazzaData[$userid] = [
          "user" => $indexPart[$userid],
          "stats" => [
            "days" => $piazzaUser["days"] ?? null,
            "posts" => $piazzaUser["posts"] ?? null,
            "asks" => $piazzaUser["asks"] ?? null,
            "answers" => $piazzaUser["answers"] ?? null,
            "views" => $piazzaUser["views"] ?? null
          ]];
      }
    }
    return $piazzaData;
  }

  private static $STREAM_COLUMNS = [
    "email" => ["index" => 9, "keywords" => ["email", "e-mail"]],
    "endorsed" => ["index" => 10, "keywords" => ["endors"]],
    "subject" => ["index" => 6, "keywords" => ["subject", "title"]],
    "type" => ["index" => 7, "keywords" => ["part of post", "type", "kind"]],
    "contents" => ["index" => 5, "keywords" => ["html removed", "body", "content"]],
    "timestamp" => ["index" => 3, "keywords" => ["created", "date", "time"]],
    "post_no" => ["index" => 1, "keywords" => ["post number", "post no", "post"]],
  ];

  private function fallbackStreamColumns() {
    $fallback = [];
    foreach (self::$STREAM_COLUMNS as $field => $spec) {
      $fallback[$field] = $spec["index"];
    }
    return $fallback;
  }

  private function streamColumns($header) {
    if ($header === null || count($header) === 0)
      return $this->fallbackStreamColumns();

    $names = [];
    foreach ($header as $index => $name) {
      $names[$index] = strtolower(trim((string) $name));
    }

    $found = [];
    $claimed = [];
    foreach (self::$STREAM_COLUMNS as $field => $spec) {
      foreach ($spec["keywords"] as $keyword) {
        $match = null;
        foreach ($names as $index => $name) {
          if (isset($claimed[$index]) || $name === "")
            continue;
          if (strpos($name, $keyword) !== false) {
            $match = $index;
            break;
          }
        }

        if ($match !== null) {
          $found[$field] = $match;
          $claimed[$match] = true;
          break;
        }
      }
    }

    if (count($found) !== count(self::$STREAM_COLUMNS))
      return $this->fallbackStreamColumns();

    return $found;
  }

  private function isBlankRow($data) {
    return count($data) === 1 && ($data[0] === null || trim($data[0]) === "");
  }

  public function parsePiazzaStream($participants = []) {

    $piazzaRaw = $this->readPiazzaUploadFile("contributions.csv", false);

    $piazzaRaw = preg_replace('/^\xEF\xBB\xBF/', '', $piazzaRaw);

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
    $columns = null;
    $widest = null;
    $rows = 0;
    $parsed = 0;

    while (($data = fgetcsv($handle, 0, ",")) !== false) {
      if ($this->isBlankRow($data))
        continue;

      if ($header === null) {
        $header = $data;
        $columns = $this->streamColumns($header);
        $widest = max($columns);
        continue;
      }

      $rows += 1;

      if (count($data) <= $widest)
        continue;

      $parsed += 1;

      $userid = $this->cleanUserId($data[$columns["email"]]);
      if ($userid !== false && isset($indexPart[$userid])) {
        array_push($piazzaData, [
          "post_no" => $data[$columns["post_no"]],
          "timestamp" => $data[$columns["timestamp"]],
          "subject" => $data[$columns["subject"]],
          "contents" => $data[$columns["contents"]],
          "type" => $data[$columns["type"]],
          "endorsed" => $this->isEndorsedValue($data[$columns["endorsed"]]),
          "user" => $indexPart[$userid]
        ]);
      }
    }
    fclose($handle);

    if ($rows > 0 && $parsed === 0)
      throw new \asci\exceptions\ASCIUploadException(
        "None of the $rows rows in contributions.csv have the expected columns. "
        . "The Piazza export format may have changed."
      );

    return $piazzaData;
  }

  private function isEndorsedValue($value) {
    $text = strtolower(trim((string) $value));

    return $text === "true" || $text === "t" || $text === "yes" || $text === "1";
  }
}
