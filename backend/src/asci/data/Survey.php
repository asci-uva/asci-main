<?php

namespace asci\data;

class Survey implements \Serializable {

    public $session_id;
    public $user_id;
    public $q1_score;
    public $q2_score;
    public $q3_score;
    public $q4_score;
    public $q5_score;
    public $feedback;
    
    
    public function __construct()
    {
        
        
    }


    public function fromArray($row){

        $this->session_id = $row['session_id'] ?? null;
        $this->user_id = $row['user_id'] ?? null;
        $this->q1_score = $row['q1_score'] ?? null;
        $this->q2_score = $row['q2_score'] ?? null;
        $this->q3_score = $row['q3_score'] ?? null;
        $this->q4_score = $row['q4_score'] ?? null;
        $this->q5_score = $row['q5_score'] ?? null;
        $this->feedback = $row['feedback'] ?? null;
        
        
        return $this;
    }

    public function toArray() {
        return array(
            "session_id" => $this->session_id,
            "user_id" => $this->user_id,
            "q1_score" => $this->q1_score,
            "q2_score" => $this->q2_score,
            "q3_score" => $this->q3_score,
            "q4_score" => $this->q4_score,
            "q5_score" => $this->q5_score,
            "feedback" => $this->feedback
        );
    }
    
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