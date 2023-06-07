<?php

/**
 * Class that connects to the python implementation of cosine-similarity matching
 *
 *
 * License:
 *
 *
 * @author Robbie Hott
 * @author Mark Floryan
 */
namespace asci\util;

/**
 * CosineSim Class
 *
 * The purpose of this class is to interact with a python implementation of Cosine Similarity
 * matching. A list of strings is passed to this program and a list of matches above threshold
 * is returned
 *
 * @author Robbie Hott
 * @author Mark Floryan
 */

class CosineSim
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
        $this->logger = new \Monolog\Logger('Server');
        $this->logger->pushHandler($log);
    }

    public function testFindMatches(){
        $listOfStrings = [
            "I need help on bit fiddling homework",
            "I love dogs",
            "bit fiddling homework is pretty hard",
            "I'm stuck on bit fiddling"
        ];

        return $this->findMatches($listOfStrings);
    }

    
    public function findMatches($listOfStrings){

        /* TODO: Implement this function */

        /* Testing opening up pipes and just sending some simple data */
        $descriptorspec = array(
            0 => array("pipe", "r"),  // stdin is a pipe that the child will read from
            1 => array("pipe", "w"),  // stdout is a pipe that the child will write to
            2 => array("pipe", "w")
        );

        /* Hardcoding the call to the python script for now */
        $command = "python3 /opt/src/asci/util/group_cosine.py";
        
        $pipes = array();
        $process = proc_open($command, $descriptorspec, $pipes);

        if (is_resource($process)) {
            // $pipes now looks like this:
            // 0 => writeable handle connected to child stdin
            // 1 => readable handle connected to child stdout

            foreach($listOfStrings as $nextStr){
                fwrite($pipes[0], $nextStr . "\n");    
            }
            fwrite($pipes[0], "-1");
            
            fclose($pipes[0]);
            $output = stream_get_contents($pipes[1]);
            fclose($pipes[1]);
            $error = stream_get_contents($pipes[2]);
            fclose($pipes[2]);

            // It is important that you close any pipes before calling
            // proc_close in order to avoid a deadlock
            $return_value = proc_close($process);
            return [$return_value, $output, $error];
        }

        return null;
    }

    
}
