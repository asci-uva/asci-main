<?php

namespace asci\server\database;


class DBLogs
{
    /* Reference to the database connection */
    private $db;


    /**
     * @var \Monolog\Logger $logger Logger for this class
     */
    private $logger = null;

    public function __construct($db)
    {
        global $log;

        $this->db = $db;
        $this->logger = new \Monolog\Logger('DBUser');
        $this->logger->pushHandler($log);
    }

    public function log($user_id, $type, $action)
    {
        $query = 'insert into logs (user_id, log_type, action) values ($1, $2, $3)';

        $result = $this->db->query($query, array($user_id, $type, $action));

        if($result) return true;
        else return false;
    }

    
}
