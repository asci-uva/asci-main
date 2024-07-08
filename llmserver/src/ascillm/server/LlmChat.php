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


    public function runScript($scriptName, $stdInput=null, ...$params) {
        /* Testing opening up pipes and just sending some simple data */
        $descriptorspec = array(
            0 => array("pipe", "r"),  // stdin is a pipe that the child will read from
            1 => array("pipe", "w"),  // stdout is a pipe that the child will write to
            2 => array("pipe", "w")
        );

        $command = "export HF_HOME=/tmp; export TOKENIZERS_PARALLELISM=true; python3 $scriptName";
        if (!empty($params))
          $command .= " " . implode(" ", $params);

        // print out the command
        $this->logger->debug("Command: " . $command);
        
        $pipes = array();
        $process = proc_open($command, $descriptorspec, $pipes);
        $this->logger->debug("opened proc: " . $command);
        
        if ($stdInput != null)
          $this->logger->debug("Writing stdin", $stdInput);

        if (is_resource($process)) {
            // $pipes now looks like this:
            // 0 => writeable handle connected to child stdin
            // 1 => readable handle connected to child stdout



          if ($stdInput != null && !empty($stdInput))
            foreach ($stdInput as $line)
              fwrite($pipes[0], $line."\n");  
            fclose($pipes[0]);
            
            $output = stream_get_contents($pipes[1]);
            fclose($pipes[1]);
            $error = stream_get_contents($pipes[2]);
            fclose($pipes[2]);

            // It is important that you close any pipes before calling
            // proc_close in order to avoid a deadlock
            $return_value = proc_close($process);

            if ($return_value != 0) {
                $this->logger->error("Process ended with an error: " . $error);
            }

            $this->logger->addDebug("Called the process", ["output"=>$output, "error"=> $error, "retval" => $return_value]);
            return [
              "retval" => $return_value,
              "output" => $output,
              "error" => $error
            ];
        } else {
          $this->logger->addDebug("Could not open the process");
          throw new \ascillm\exceptions\ASCILLMException("Could not run LLM code");
        }

        return false;
    }
    
    public function getLlmResponse($input=null, $course=null){

      if ($input == null)
        throw new \ascillm\exceptions\ASCILLMException("User input was not provided");

      if ($course == null || !is_numeric($course))
        throw new \ascillm\exceptions\ASCILLMException("Course was not provided");

      // TODO check that course directory does exist

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

      $llm_data = [
        json_encode($input)
      ];

        $result = $this->runScript(\ascillm\Config::$LLM_CHAT_SCRIPT, $llm_data, $course);

        $this->logger->addDebug("LLM output", $result); 
        /* If the LLM Chat call failed, report that to frontend */
        if ($result === false || $result["output"] == null || $result["retval"] != 0) 
          return false;

        /* We made it, return the sessions (up to max) that we care about */
        return $this->sanitize(json_decode($result["output"], true));

    }

    private function sanitize($data) {
      $result = $data;
      $context = [];
      foreach ($data["context"] as $c) {
        if (stripos($c["file_name"], "piazza") === false)
          array_push($context, $c);
      }
      $result["context"] = $context;
      $result["content"] = preg_replace("/^.*Assistant response:/", "", $result["content"]);
      $result["content"] = str_replace('"""', "", $result["content"]);
      return $result;
    }

    public function generateRAG($course) {
        $result = $this->runScript(\ascillm\Config::$LLM_RAG_SCRIPT, null, $course);
    } 
}
