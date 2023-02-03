<?php

namespace asci\data;

class SessionUser implements \Serializable {

    public $sessionId;
    public $userId;
    public $role;
    public $user_status;


    public function __construct()
    {
        
        
    }

    public function fromParams($userId, $sessionId, $role, $user_status){
        $this->sessionId = $sessionId;
        $this->userId = $userId;
        $this->role = $role;
        $this->user_status = $user_status;
    }

    public function fromArray($row){

        $this->sessionId = $row['session_id'] ?? null;
        $this->userId = $row['user_id'] ?? null;
        $this->role = $row['role'] ?? null;
        $this->status = $row['user_status'] ?? null;

        return $this;
        
    }

    public function toArray() {
        return array(
            "session_id" => $this->sessionId,
            "user_id" => $this->userId,
            "role" => $this->role,
            "user_status" => $this->user_status
        );
    }


    public function getSessionId(){ return $this->sessionId; }
    public function getUserId(){ return $this->userId; }
    public function getRole(){ return $this->role; }
    public function getUserStatus(){ return $this->user_status; }

    


    
    public function toJSON() {
        return json_encode($this->toArray(), JSON_PRETTY_PRINT);
    }

    public function fromJSON($json) {
        $data = json_decode($json, true);
        $return = $this->fromArray($data);
        unset($data);
        return $return;
    }

    public function serialize() {
        return $this->toJSON();
    }

    public function unserialize($data) {
        $this->fromJSON($data);
    }
}