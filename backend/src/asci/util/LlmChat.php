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

        $this->serverURL = \asci\Config::$LLM_SERVER_URL;
    }

    public function getLlmResponse($input) {

      $query = [
        "command" => "llmchat",
        "data" => $input
      ]; 

      $response = $this->query($query);

      return $response["response"];
    }

    public function query($query) {
        $this->logger->addDebug("Sending the following server query to {$this->serverURL}", $query);
        // Encode the query as json
        $data = json_encode($query);

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




}

