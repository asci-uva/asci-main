<?php

namespace asci\server\database;

class DBUser
{
    /**
     * SQL object
     *
     * @var \asci\server\database\SQL low-level SQL class
     */
    private $sql = null;

    /**
     * Database connector object
     *
     * @var \asci\server\database\DatabaseConnector object.
     */
    private $DB = null;

    /**
     * @var \Monolog\Logger $logger Logger for this class
     */
    private $logger = null;

    public function __construct()
    {
        global $log;
        $this->DB = new \asci\server\database\DatabaseConnector();

        $this->sql = new \asci\server\database\SQL($this->DB);
        $this->logger = new \Monolog\Logger('DBUser');
        $this->logger->pushHandler($log);
    }

    public function getUser($computing_id)
    {
        $result = $this->sql->getUser($computing_id);
        return $result["count"] != 0 ? true : false;
    }

    public function createUser($user)
    {
        if (!$this->getUser($user->getComputingID())) {
            $result = $this->sql->insertUser(
                $user->getComputingID(),
                $user->getFirstName(),
                $user->getLastName(),
                $user->getPreferredName(),
                $user->getHashedPassword()
            );
            return $result;
        } else {
            return false;
        }
    }
}