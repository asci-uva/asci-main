<?php

/**
 * Class that connects to the python implementation of LLM-based chatbot
 * The code is based on the code from the CosineSim class
 *
 *
 * License:
 *
 *
 * @author Robert Bao
 * Based on code by Robbie Hott and Mark Floryan (CosineSim.php)
 */
namespace asci\util;

/**
 * LlmChat Connector Class
 *
 * The purpose of this class is to interact with a python implementation of LLM-based chatbot. 
 * Two strings (the question and an optional assignment name) are passed to this program, 
 * and an response from LLM (in the form of a JSON object) is returned.
 *
 * @author Robbie Hott
 */

class LlmChat
{

    /**
     * @var \Monolog\Logger $logger the logger for this server
     */
    private $logger;


    private $serverURL;

    /**
     * Constructor
     *
     * Takes no input
     *
     * @param array $input Input to the server
     */
    public function __construct()
    {
        global $log;

        // create a log channel
        $this->logger = new \Monolog\Logger('LLMChat');
        $this->logger->pushHandler($log);

        // LLM_SERVER_URL env var takes priority (set on Heroku to the chat app URL).
        // Falls back to the static Config value for local/Docker dev.
        $this->serverURL = getenv('LLM_SERVER_URL') ?: \asci\Config::$LLM_SERVER_URL;
    }

    public function getLlmResponse($data, $course) {

        // Build request object
        $query = [
          "course" => $course["course_id"],
          "command" => "llmchat",
          "data" => [
            "command" => $data["command"],
            "studentQuestion" => $data["studentQuestion"]
          ]
        ];
        if (isset($data["assignmentName"]))
         $query["data"]["assignmentName"] = $data["assignmentName"]; 

        if (isset($data["chatHistory"]))
         $query["data"]["chatHistory"] = $data["chatHistory"]; 



      $response = $this->query($query);

      return $response["response"];
    }

    /**
     * Streaming version: forwards SSE events from the LLM server to the client.
     */
    public function getLlmResponseStreaming($data, $course) {
        // Map streaming command names back to the original names for the Python script
        $commandMap = [
          "newLlmChatStream" => "newLlmChat",
          "followupLlmChatStream" => "followupLlmChat",
        ];
        $innerCommand = $commandMap[$data["command"]] ?? $data["command"];

        $query = [
          "course" => $course["course_id"],
          "command" => "llmchat",
          "stream" => true,
          "data" => [
            "command" => $innerCommand,
            "studentQuestion" => $data["studentQuestion"]
          ]
        ];
        if (isset($data["assignmentName"]))
         $query["data"]["assignmentName"] = $data["assignmentName"];

        if (isset($data["chatHistory"]))
         $query["data"]["chatHistory"] = $data["chatHistory"];

        $this->queryStreaming($query);
    }

    public function getLlmSummary($data, $course) {
      
      // Build request object
        $query = [
          "course" => $course["course_id"],
          "command" => "llmsummary",
          "data" => [
            "command" => $data["command"],
            "question" => $data["question"],
            "code" => $data["code"],
          ]
        ];

        $response = $this->query($query);;
        //error_log("response: " . print_r($response, true));
        return $response;
    }

    public function uploadContent($course) {

      $response = [
            "result" => "failure"
        ];

        $file = null;
        if (isset($_FILES['coursecontent']) && !(!isset($_FILES['coursecontent']['error']) ||
            is_array($_FILES['coursecontent']['error']))) {
            // Check $_FILES[$name]['error'] value.
            switch ($_FILES['coursecontent']['error']) {
                case UPLOAD_ERR_OK:
                    break;
                case UPLOAD_ERR_NO_FILE:
                    return array_merge($response, ["error" => "No file selected."]);
                case UPLOAD_ERR_INI_SIZE:
                case UPLOAD_ERR_FORM_SIZE:
                    return array_merge($response, ["error" => "File exceeded the filesize limit.  Please contact us."]);
                default:
                    return array_merge($response, ["error" => "An unknown error occurred in uploading the file"]);
            }

            // You should also check filesize here.
            if ($_FILES['coursecontent']['size'] > \asci\Config::$MAX_UPLOAD_SIZE) {
                return array_merge($response, ["error" => "File exceeded the filesize limit.  Please contact us."]);
            }

            $finfo = new \finfo(FILEINFO_MIME_TYPE);
            $mimeType = $finfo->file($_FILES['coursecontent']['tmp_name']);
            if (false === $ext = array_search(
                $mimeType,
                //allow for various file type uploads
                array(
                    'zip' => 'application/zip',
                    'pdf' => 'application/pdf',
                    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'png' => 'image/png',
                    'jpg' => 'image/jpeg',
                    'txt' => 'text/plain'
                ),
                true
            )) {
                return array_merge($response, ["error" => "Invalid upload file format: " .$finfo->file($_FILES['coursecontent']['tmp_name']). ".  Please upload a ZIP file."]);
            }

            $file = base64_encode(file_get_contents($_FILES['coursecontent']['tmp_name']));
        } else {
          return array_merge($response, ["error" => "An error occurred in uploading the file."]);
        }

        


        // Build request object
        $query = [
          "course" => $course["course_id"],
          "command" => "uploadContent",
          "file" => [
            "mime-type" => $mimeType,
            "name" => $_FILES['coursecontent']['name'],
            "content" => $file
          ]
        ];

      $response = $this->query($query);

      return $response;
    }

    public function uploadPiazza($course) {

      $response = [
            "result" => "failure"
        ];

        $file = null;
        if (isset($_FILES['piazzacontent']) && !(!isset($_FILES['piazzacontent']['error']) ||
            is_array($_FILES['piazzacontent']['error']))) {
            // Check $_FILES[$name]['error'] value.
            switch ($_FILES['piazzacontent']['error']) {
                case UPLOAD_ERR_OK:
                    break;
                case UPLOAD_ERR_NO_FILE:
                    return array_merge($response, ["error" => "No file selected."]);
                case UPLOAD_ERR_INI_SIZE:
                case UPLOAD_ERR_FORM_SIZE:
                    return array_merge($response, ["error" => "File exceeded the filesize limit.  Please contact us."]);
                default:
                    return array_merge($response, ["error" => "An unknown error occurred in uploading the file"]);
            }

            // You should also check filesize here.
            if ($_FILES['piazzacontent']['size'] > \asci\Config::$MAX_UPLOAD_SIZE) {
                return array_merge($response, ["error" => "File exceeded the filesize limit.  Please contact us."]);
            }

            $finfo = new \finfo(FILEINFO_MIME_TYPE);
            if (false === $ext = array_search(
                $finfo->file($_FILES['piazzacontent']['tmp_name']),
                array(
                    'zip' => 'application/zip'
                ),
                true
            )) {
                return array_merge($response, ["error" => "Invalid upload file format: " .$finfo->file($_FILES['piazzacontent']['tmp_name']). ".  Please upload a ZIP file."]);
            }

            $file = false; 
  
            $zip = new \ZipArchive;
            if ($zip->open($_FILES['piazzacontent']['tmp_name'], \ZipArchive::RDONLY) === true) {
              $file = $zip->getFromName("class_content_flat.json");
              if ($file === false)
                return array_merge($response, ["error" => "Could not find Piazza course contents in zip."]);
              $zip->close();
            } else {
              return array_merge($response, ["error" => "Could not open Piazza zip file."]);
            }
        } else {
          return array_merge($response, ["error" => "An error occurred in uploading the file."]);
        }

        
        if ($file === false)
          return array_merge($response, ["error" => "An error occurred when uploading the file."]);

        $piazzaData = json_decode($file, true);
        if ($piazzaData === null)
          return array_merge($response, ["error" => "An error occurred when decoding the Piazza course content."]);

        // Build request object
        $query = [
          "course" => $course["course_id"],
          "command" => "uploadPiazza",
          "data" => $piazzaData
        ];

      $response = $this->query($query);

      return $response;
    }

    public function query($query) {
        $this->logger->addDebug("Sending the following server query to {$this->serverURL}", $query);
        // Encode the query as json
        $data = json_encode($query);;

        // Use CURL to send request to the internal server
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->serverURL);
        curl_setopt($ch, CURLOPT_HTTPHEADER,
                array (
                        'Content-Type: application/json',
                        'Content-Length: ' . strlen($data)
                ));
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $response = curl_exec($ch);

        if($errno = curl_errno($ch)) {
          $error_message = curl_strerror($errno);
          $this->logger->addError("cURL error ({$errno}):\n {$error_message}");
        }
        curl_close($ch);


        // Return the server response as associative array
        $return = json_decode($response, true);
        if ($return == null) {
            $this->logger->addDebug("Got the following improper server response", array($response));
            return $response;
        }

        $this->logger->addDebug("Got the following server response", $return);

        return $return;
    }

    /**
     * Streaming CURL query: forwards SSE events from the LLM server directly to the client.
     */
    public function queryStreaming($query) {
        $this->logger->addDebug("Sending streaming query to {$this->serverURL}");
        $data = json_encode($query);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->serverURL);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            'Content-Type: application/json',
            'Content-Length: ' . strlen($data)
        ));
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
        // Forward each chunk to the client as it arrives
        curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($ch, $chunk) {
            echo $chunk;
            ob_flush();
            flush();
            return strlen($chunk);
        });

        curl_exec($ch);

        if ($errno = curl_errno($ch)) {
            $error_message = curl_strerror($errno);
            $this->logger->addError("Streaming cURL error ({$errno}):\n {$error_message}");
            echo "data: " . json_encode(["type" => "error", "message" => "Connection to LLM server failed"]) . "\n\n";
            flush();
        }
        curl_close($ch);
    }




}

