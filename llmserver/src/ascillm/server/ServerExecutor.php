<?php

/**
 * Server Executor Class File
 *
 * Contains the ServerExector class that performs all the tasks for the main Server
 *
 * @author Robbie Hott
 * @license https://opensource.org/licenses/BSD-3-Clause BSD 3-Clause
 * @copyright 2016 the Rector and Visitors of the University of Virginia, and
 *            the Regents of the University of California
 */
namespace ascillm\server;

class ServerExecutor {

  //Logging
  private $logger;

  private $chat;


  public function __construct(){
    global $log;
    
    $this->chat = new LlmChat();

    // create a log channel
    $this->logger = new \Monolog\Logger('ServerExecutor');
    $this->logger->pushHandler($log);
  }


  public function llmChat($input) {

    $this->logger->addDebug("Handling request", $input);
    $response = $this->chat->getLlmResponse($input["data"], $input["course"]);

    if ($response === false)
      throw new \ascillm\exceptions\ASCILLMException("Could not connect to LLM");

    return $response;
  }

  public function createContentRAG($input) {
    if (!isset($input["course"]) || !is_numeric($input["course"]))
      throw new \ascillm\exceptions\ASCILLMException("Course not provided");

    if (!isset($input["file"]) || !isset($input["file"]["mime-type"]) || !isset($input["file"]["content"])) {
      throw new \ascillm\exceptions\ASCILLMException("No file uploaded");
    }

    $dir = \ascillm\Config::$LLM_DATA_DIR.$input["course"]."/";

    // Clear and recreate the directory
    if (!is_dir($dir))
      mkdir($dir);
    if (!is_dir($dir."data"))
      mkdir($dir."data");
    if (is_dir($dir."data/content"))
      $this->delTree($dir."data/content");
    mkdir($dir."data/content");

    // get the file contents
    $file = base64_decode($input["file"]["content"]);


    // Unzip the file
    $tmpfile = $dir."__tempzip.zip";
    file_put_contents($tmpfile, $file);
    $zip = new \ZipArchive();

    // NOTE: Mac OS Zip files seem to fail consistency checks
    // It works to ignore this check, but we should NOT let everyone upload
    // files -- only trusted sources!
    $result = $zip->open($tmpfile, \ZipArchive::CHECKCONS);
    if ($result !== true) {
      switch($result) {
      case \ZipArchive::ER_NOZIP:
        throw new \ascillm\exceptions\ASCILLMException('Uploaded file is not a zip archive.');
      case \ZipArchive::ER_INCONS :
        // Workaround for Mac zip files -- if they are inconsistent, that's okay
        $result = $zip->open($tmpfile);
        if ($result === true)
          break;
        throw new \ascillm\exceptions\ASCILLMException('Uploaded file failed consistency check.');
      case \ZipArchive::ER_CRC :
        throw new \ascillm\exceptions\ASCILLMException('Uploaded file failed checksum.');
      default:
        throw new \ascillm\exceptions\ASCILLMException('An error occurred: ' . $result);
      }
    }

    // Loop through all files in the zip
    for($i = 0; $i < $zip->numFiles; $i++) {
      $innerPath = $zip->getNameIndex($i);
      $fileinfo = pathinfo($innerPath);

      // check for MACOSX folder, too.
      if (strpos($innerPath, 'MACOSX') === false)
        file_put_contents($dir."data/content/".$fileinfo['basename'], $zip->getFromIndex($i));
    }

    $zip->close();

    unlink($tmpfile);

    if (is_dir($dir."storage"))
      $this->delTree($dir."storage");
    mkdir($dir."storage");
    $this->chat->generateRAG($input["course"]);

    return ["result" => "success"];
  }

  public function createPiazzaRAG($input) {
    if (!isset($input["course"]) || !is_numeric($input["course"]))
      throw new \ascillm\exceptions\ASCILLMException("Course not provided");

    if (!isset($input["file"]) || !isset($input["file"]["mime-type"]) || !isset($input["file"]["content"])) {
      throw new \ascillm\exceptions\ASCILLMException("No file uploaded");
    }

    $dir = \ascillm\Config::$LLM_DATA_DIR.$input["course"]."/";

    // Clear and recreate the directory
    if (!is_dir($dir))
      mkdir($dir);
    if (!is_dir($dir."data"))
      mkdir($dir."data");
    if (is_dir($dir."data/piazza"))
      $this->delTree($dir."data/piazza");
    mkdir($dir."data/piazza");

    // get the file contents
    $file = base64_decode($input["file"]["content"]);

    $json = json_decode($file, true);

    $qns = [];

    foreach ($json as $q) {
      if (!isset($q["thread_id"])) {
        $qns[$q["id"]] = [
          $q
        ];
      } else if (isset($qns[$q["thread_id"]])) {
        array_push($qns[$q["thread_id"]], $q);
      }
    }

    foreach ($qns as $k => $arr) {
      $output = "";

      foreach ($arr as $v) {
        if (isset($v["subject"]))
          $output .= "# " . $v["subject"] . "\n\n";
        $output .= $v["content"] . "\n\n";
      }

      file_put_contents($dir."data/piazza/piazza-$k.md", $output);
    }
    
    if (is_dir($dir."storage"))
      $this->delTree($dir."storage");
    mkdir($dir."storage");
    $this->chat->generateRAG($input["course"]);

    return ["result" => "success"];
  }

  /**
   * Recursively delete a directory
   *
   * Deletes a directory and it's contents from the filesystem.
   * From https://www.php.net/manual/en/function.rmdir.php
   *
   * @param $dir The temporary directory to delete
   */
  private function delTree($dir) {
    $files = array_diff(scandir($dir), array('.','..'));
    foreach ($files as $file) {
      (is_dir("$dir/$file")) ? $this->delTree("$dir/$file") : unlink("$dir/$file");
    }
    return rmdir($dir);
  }

}
