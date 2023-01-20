<?php

namespace asci\server\database;

use asci\data\User as User;

class DBUser
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

    public function getUser($computing_id)
    {
        $query = 'select * from users where computing_id = $1';
        $result = $this->db->query($query, array($computing_id));


        $row = $this->db->fetchrow($result);

        $user = new \asci\data\User();
        $user->fromArray($row);

        return $user;
    }

   
}
