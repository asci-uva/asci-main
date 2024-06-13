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
namespace ascillm\server;

/**
 * LlmChat Class
 *
 * The purpose of this class is to interact with a python implementation of LLM-based chatbot. 
 * Two strings (the question and an optional assignment name) are passed to this program, 
 * and an response from LLM (in the form of a JSON object) is returned.
 *
 * @author Robert Bao
 */

class LlmChat
{

    /**
     * Input parameters from the querier
     *
     * @var array Associative array of the input query
     */
    private $input = null;

    /**
     * @var \Monolog\Logger $logger the logger for this server
     */
    private $logger;

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
    }

    public function testGetLlmResponse(){
        $input_str = "{'command': 'newLlmChat', 'assignmentName': '', 'studentQuestion': 'hi'}";

        return $this->getLlmResponse($input_str);
    }

    
    public function getLlmResponse($input){

      if (\ascillm\Config::$FAKE_LLM_MODE) {
        // Pause as if we're waiting for a reply
        sleep(5);
        // Reply with a canned answer
          return [
            "role" => "assistant",
            "content" => "This is an example LLM response for testing",
            "questions" => ["One question", "A second question"],
            "context" => [
              [
                "file_name" => "syllabus.md",
                "text" => "A clip from the syllabus text."
              ],
              [
                "file_name" => "day1-slides.pdf",
                "page_label" => "21",
                "text" => "text in the middle of the day 1 slides"
              ]
            ]
          ];
        }

        /* Testing opening up pipes and just sending some simple data */
        $descriptorspec = array(
            0 => array("pipe", "r"),  // stdin is a pipe that the child will read from
            1 => array("pipe", "w"),  // stdout is a pipe that the child will write to
            2 => array("pipe", "w")
        );

        /* Hardcoding the call to the python script for now */
        $command = "python3 " . \ascillm\Config::$LLM_CHAT_SCRIPT;

        // print out the command
        $this->logger->debug("Command: " . $command);
        
        $pipes = array();
        $process = proc_open($command, $descriptorspec, $pipes);
        $this->logger->debug("opened proc: " . $command);

        if (is_resource($process)) {
            // $pipes now looks like this:
            // 0 => writeable handle connected to child stdin
            // 1 => readable handle connected to child stdout

            $json_data = json_encode($input);


            fwrite($pipes[0], $json_data . "\n");  
            fwrite($pipes[0], "-1");
            
            fclose($pipes[0]);
            $output = stream_get_contents($pipes[1]);
            fclose($pipes[1]);
            $error = stream_get_contents($pipes[2]);
            fclose($pipes[2]);

            // It is important that you close any pipes before calling
            // proc_close in order to avoid a deadlock
            $return_value = proc_close($process);

            if ($return_value == 1) {
                $this->logger->error("Process ended with an error: " . $error);
                //echo "Detailed Error: " . $error . "\n";
            }

            $this->logger->addDebug("Called the process", ["output"=>$output, "retval" => $return_value]);

            /* If the LLM Chat call failed, report that to frontend */
            if($output == null || $return_value != 0) return false;

            /* We made it, return the sessions (up to max) that we care about */
            return json_decode($output, true);
        } else {
          $this->logger->addDebug("Could not open the process");
          throw new \ascillm\exceptions\ASCILLMException("Could not run LLM code");
        }

        $this->logger->debug("Made it here");
        return false;
    }

    
}
