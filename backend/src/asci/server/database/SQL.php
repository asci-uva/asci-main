<?php

namespace asci\server\database;
/**
 * SQL Class
 * 
 * Keep all low level SQL methods in this class.
 * 
 */

class SQL
{
    private $sdb = null;

    private $logger;

    public function __construct($db)
    {
        $this->sdb = $db;
        $this->enableLogging();
    }

    public function enableLogging()
    {
        global $log;
        if (!$this->logger) {
            // create a log channel
            $this->logger = new \Monolog\Logger('SQL');
            $this->logger->pushHandler($log);
        }
    }

    private function logDebug($msg, $debugArray)
    {
        if ($this->logger) {
            $this->logger->addDebug($msg, $debugArray);
        }
    }

    public function getUser($computing_id) {
        $result = $this->sdb->query(
            'select count(*) from users where computing_id = $1',
            array($computing_id)
        );
        $row = $this->sdb->fetchrow($result);
        return $row; 
    }

    public function insertUser(
        $computing_id,
        $fname,
        $lname,
        $pname,
        $password
    )
    {
        $result = $this->sdb->query(
            'insert into users 
            (computing_id, first_name, last_name, 
            preferred_name, password) 
            values ($1, $2, $3, $4, $5)',
            array(
                $computing_id,
                $fname,
                $lname,
                $pname,
                $password
            )
        );
        $row = $this->sdb->fetchrow($result);
        echo $row;
        return $row;
    }
}