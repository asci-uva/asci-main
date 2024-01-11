<?php

namespace asci\server\database;

use asci\data\User as User;

class DBSelfMadeGroup
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

    public function insert($group){

        $query = 'INSERT INTO self_made_groups (id, issue, location, creationTime, status)
                    VALUES ($1, $2, $3, $4, $5)';
        $result = $this->db->query($query, array($group->id, $group->issue, $group->location, $group->creationTime, $group->status));

        if($result) return true;
        else return false;
    }

    public function update($group){

        $query = 'UPDATE self_made_groups SET issue=$1, location=$2, creationTime=$3, status=$4
                    WHERE id=$5';
        $result = $this->db->query($query, array($group->issue, $group->location, $group->creationTime, $group->status, $group->id));

        if($result) return true;
        else return false;
    }



    public function insertMapping($selfGroupMapping){

        $query = 'INSERT INTO self_group_mapping (session_id, group_id, status)
                    VALUES ($1, $2, $3)';
        $result = $this->db->query($query, array($selfGroupMapping->session_id, $selfGroupMapping->group_id, $selfGroupMapping->status));

        if($result) return true;
        else return false;
    }

    public function updateMapping($selfGroupMapping){

        $query = 'UPDATE self_group_mapping SET session_id=$1, group_id=$2, status=$3
                    WHERE id=$5';
        $result = $this->db->query($query, array($selfGroupMapping->session_id, $selfGroupMapping->group_id, $selfGroupMapping->status, $selfGroupMapping->id));

        if($result) return true;
        else return false;
    }

    /* Get the self made group by session id if it exists (the session that MADE the group) */
    public function getSelfMadeGroup($session_id){

        $query = 'SELECT * FROM self_made_groups WHERE id=$1';
        $result = $this->db->query($query, array($session_id));

        /* Note: There should only ever be one at a time, hence this fetchrow call */
        $row = $this->db->fetchrow($result);

        if($row != null){
            $selfGroup = new \asci\data\SelfMadeGroup();
            $selfGroup->fromArray($row);
            return $selfGroup;
        }

        return null;
    }

    public function deactivateGroup($group_id){

        $query = 'UPDATE self_made_groups SET status=\'inactive\' WHERE id=$1';
        $result = $this->db->query($query, array($group_id));

        if($result) return true;
        else return false;
    }

    public function clearGroupMembers($group_id){

        $query = 'UPDATE self_group_mapping SET status=\'inactive\' WHERE group_id=$1';
        $result = $this->db->query($query, array($group_id));

        if($result) return true;
        else return false;
    }

    /* Gets the group that this session id is a part of (not the one that MADE the group) */
    public function getSelfMadeGroupByMember($session_id){

        $query = 'SELECT S.* FROM self_made_groups S JOIN self_group_mapping M on S.id=M.group_id WHERE M.session_id=$1 AND S.status=\'active\' AND M.status=\'active\'';
        $result = $this->db->query($query, array($session_id));

        /* Note: There should only ever be one at a time, hence this fetchrow call */
        $row = $this->db->fetchrow($result);

        if($row != null){
            $selfGroup = new \asci\data\SelfMadeGroup();
            $selfGroup->fromArray($row);
            return $selfGroup;
        }

        return null;

    }

    /* Get all the available self made groups for the given course */
    public function getAvailableGroups($course_id){

        $query = '(SELECT G.* FROM (self_made_groups G JOIN sessions S on G.id=S.id) WHERE S.course_id=$1 AND G.status=\'active\')';
        $result = $this->db->query($query, array($course_id));

        $groups = [];
        while($row = $this->db->fetchrow($result)){
            $groups[] = (new \asci\data\SelfMadeGroup())->fromArray($row);
        }

        return $groups;

    }

    /* Puts the user (userid) in the self made group (group id) */
    public function joinSelfMadeGroup($session_id, $group_id){

        $query = 'INSERT INTO self_group_mapping (session_id, group_id, status)
                    VALUES ($1, $2, $3)';
        $result = $this->db->query($query, array($session_id, $group_id, 'active'));

        if($result) return true;
        else return false;

    }


    public function getSelfMadeGroupMembers($group_id){

        $query = 'SELECT U.* FROM (session_users S JOIN users U ON S.user_id = U.id) WHERE S.session_id IN (SELECT session_id FROM self_group_mapping WHERE group_id=$1)';

        $result = $this->db->query($query, array($group_id));

        $users = [];
        while($row = $this->db->fetchrow($result)){
            $users[] = (new \asci\data\User())->fromArray($row);
        }

        return $users;
    }

    

   
}
