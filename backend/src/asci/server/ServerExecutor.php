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
namespace asci\server;
//todo: we might want seperate classes around certain functionality 
use asci\server\database\DatabaseConnector as DatabaseConnector;

class ServerExecutor{
    /**
     * Database connector object
     *
     * @var \asci\server\database\DatabaseConnector object.
     */
    private $db = null;
    public $result = null;

    public function __construct(){
//        $this->db = new \asci\server\database\DatabaseConnector();
        $this->db = new DatabaseConnector();
        $query = "select * from oh.users;";
        $this->result = $this->db->query($query, array());
        $this->printResult();
    }
   public function printResult(){
       $this->lookup = array();
//       while ($res = $this->db->fetchRow($this->result)) {
//           $lookup[$res["id"]] = $res["value"];
//       }
       echo "<pre>";
       echo "THIS WORKS\n";
//        echo $this->lookup;
       echo print_r($this->db->fetchRow($this->result));
        echo "AFTER RESULT\n";
        echo "</pre>";
   }
    
    
}