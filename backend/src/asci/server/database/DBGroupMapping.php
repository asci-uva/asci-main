<?php

namespace asci\server\database;

use asci\data\User as User;

class DBGroupMapping
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

    public function getMappingFromSession($from_session, $status='active')
    {
        $query = 'select * from group_mapping where from_session=$1 and status=$2';
        $result = $this->db->query($query, array($from_session, $status));

        /* Note: There should only ever be one at a time, hence this fetchrow call */
        $row = $this->db->fetchrow($result);

        $user = new \asci\data\GroupMapping();
        $user->fromArray($row);

        return $user;
    }

    public function getMappingToSession($to_session, $status='active')
    {
        $query = 'select * from group_mapping where to_session=$1 and status=$2';
        $result = $this->db->query($query, array($to_session, $status));

        $sessions = [];
        while($row = $this->db->fetchrow($result)){
            $sessions[] = (new \asci\data\GroupMapping())->fromArray($row);
        }

        return $sessions;
    }

    public function insert($group_mapping){
        $query = 'INSERT INTO group_mapping (from_session, to_session, status)
                    values ($1, $2, $3)';

        $result = $this->db->query($query, array($group_mapping->getFromSession(), $group_mapping->getToSession(), $group_mapping->getStatus()));


        if($result) return true;
        else return false;
    }

    /* Note that only the status can be updated */
    public function update($group_mapping){
        $query = 'UPDATE group_mapping SET status=$3 WHERE from_session=$1 and to_session=$2;';

        $result = $this->db->query($query, array($group_mapping->getFromSession(), $group_mapping->getToSession(), $group_mapping->getStatus()));


        if($result) return true;
        else return false;
    }

    

    public function endAllSessionsFrom($session_id){
        $query = 'UPDATE group_mapping set status=\'inactive\' WHERE from_session=$1;';

        $result = $this->db->query($query, array($session_id));


        if($result) return true;
        else return false;

    }
   
}
