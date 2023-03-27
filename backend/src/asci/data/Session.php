<?php

namespace asci\data;

class Session implements \Serializable {

    public $id;
    public $course_id;
    public $issue;
    public $issue_subject;
    public $location;
    public $status;
    public $entry_time;
    public $fulfillment_time;
    public $exit_time;
    public $session_id;
    public $user_id;
    public $role;
    public $is_group;


    public function __construct()
    {
        
        
    }

    public function fromArray($row){

        $this->id = $row['id'] ?? null;
        $this->course_id = $row['course_id'] ?? null;
        $this->issue = $row['issue'] ?? null;
        $this->issue_subject = $row['issue_subject'] ?? null;
        $this->location = $row['location'] ?? null;
        $this->status = $row['status'] ?? null;
        $this->entry_time = $row['entry_time'] ?? null;
        $this->fulfillment_time = $row['fulfillment_time'] ?? null;
        $this->exit_time = $row['exit_time'] ?? null;
        $this->session_id = $row['session_id'] ?? null;
        $this->user_id = $row['user_id'] ?? null;
        $this->role = $row['role'] ?? null;
        $this->is_group = $row['is_group'] ?? null;

        return $this;
        
    }

    public function toArray() {
        return array(
            "id" => $this->id,
            "course_id" => $this->course_id,
            "issue" => $this->issue,
            "issue_subject" => $this->issue_subject,
            "location" => $this->location,
            "status" => $this->status,
            "entry_time" => $this->entry_time,
            "fulfillment_time" => $this->fulfillment_time,
            "exit_time" => $this->exit_time,
            "session_id" => $this->session_id,
            "user_id" => $this->user_id,
            "role" => $this->role,
            "is_group" => $this->is_group
        );
    }


    public function getId(){ return $this->id; }
    public function getCourseId(){ return $this->course_id; }
    public function getIssue(){ return $this->issue; }
    public function getIssueSubject(){ return $this->issue_subject; }
    public function getLocation(){ return $this->location; }
    public function getStatus(){ return $this->status; }
    public function getEntryTime(){ return $this->entry_time; }
    public function getFulfillmentTime(){ return $this->fulfillment_time; }
    public function getExitTime(){ return $this->exit_time; }
    public function getSessionId(){ return $this->session_id; }
    public function getUserId(){ return $this->user_id; }
    public function getRole(){ return $this->role; }
    public function getIsGroup(){ return $this->is_group; }

    


    
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