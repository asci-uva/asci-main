<?php

namespace asci\server\database;

/*
 * Interacts with the database to fetch info about session user pairs
 */
class DBSessionUser
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
        $this->logger = new \Monolog\Logger('DBSession');
        $this->logger->pushHandler($log);
    }

    /*
     * inserts this session_user object into the database
     */
    public function insert($session_user){
        $query = 'insert into session_users (user_id, session_id, role) values ($1, $2, $3);';

        $result = $this->db->query($query, array($session_user->getUserId(), $session_user->getSessionId(), $session_user->getRole()));

        return $result;
    }

    public function getSessionUser($user_id, $session_id){
        $query = 'select * from session_users where user_id=$1 and session_id=$2';

        $result = $this->db->query($query, array($user_id, $session_id));
        $row = $this->db->fetchrow($result);

        if($row != null){
            return (new \asci\data\SessionUser())->fromArray($row);
        }
        
        return null;
    }

    /*
     * Given data/Session object, finds all student session pairs for that.
     * sessions (in version 1.0, will just be one student but could be more)
     */
    public function getSessionUserByRole($session_id, $role)
    {
        $query = 'select * from session_users where session_id=$1 and role=$2';

        $result = $this->db->query($query, array($session_id, $role));
        $row = $this->db->fetchrow($result);

        if($row != null && $row['user_id'] != null){
            return (new \asci\data\SessionUser())->fromArray($row);
        }
        
        return null;


    }

}
