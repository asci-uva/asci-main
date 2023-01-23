<?php

namespace asci\data;

class SessionUser implements \Serializable {

    private $sessionId;
    private $userId;
    private $role;


    public function __construct()
    {
        
        
    }

    public function fromParams($userId, $sessionId, $role){
        $this->sessionId = $sessionId;
        $this->userId = $userId;
        $this->role = $role;
    }

    public function fromArray($row){

        $this->sessionId = $row['session_id'] ?? null;
        $this->userId = $row['user_id'] ?? null;
        $this->role = $row['role'] ?? null;

        return $this;
        
    }

    public function toArray() {
        return array(
            "session_id" => $this->sessionId,
            "user_id" => $this->userId,
            "role" => $this->role
        );
    }


    public function getSessionId(){ return $this->sessionId; }
    public function getUserId(){ return $this->userId; }
    public function getRole(){ return $this->role; }

    


    
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