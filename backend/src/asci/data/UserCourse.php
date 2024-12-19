<?php

namespace asci\data;

class UserCourse implements \Serializable {

    private $user_id;
    private $computing_id;
    private $course_id;
    private $mnemonic;
    private $number;
    private $name;
    private $semester;
    private $role; //the role (e.g., student) that computing_id has in this course


    public function __construct()
    {
        
        
    }


    public function fromArray($row){

        $this->user_id = $row['id'] ?? null;
        $this->computing_id = $row['computing_id'] ?? null;
        $this->course_id = $row['course_id'] ?? null;
        $this->mnemonic = $row['mnemonic'] ?? null;
        $this->number = $row['number'] ?? null;
        $this->name = $row['name'] ?? null;
        $this->semester = $row['semester'] ?? null;
        $this->role = $row['role'] ?? null;
        return $this;
    }

    public function toArray() {
        return array(
            "id" => $this->user_id,
            "computing_id" => $this->computing_id,
            "course_id" => $this->course_id,
            "mnemonic" => $this->mnemonic,
            "number" => $this->number,
            "name" => $this->name,
            "semester" => $this->semester,
            "role" => $this->role
        );
    }


    public function getCourseId()
    {
        return $this->course_id;
    }

    public function getUserId()
    {
        return $this->user_id;
    }

    public function getComputingId()
    {
        return $this->computing_id;
    }

    public function getMnemonic()
    {
        return $this->mnemonic;
    }

    public function getNumber()
    {
        return $this->number;
    }

    public function getName()
    {
        return $this->name;
    }

    public function getSemester()
    {
        return $this->semester;
    }

    public function getRole()
    {
        return $this->role;
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
