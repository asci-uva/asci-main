<?php

namespace asci\data;

class User implements \Serializable {

    private $computing_id;
    private $first_name;
    private $last_name;
    private $preferred_name;
    private $hashedPassword;

    public function __construct($data)
    { 
        $this->fromArray($data);
    }

    public function getComputingID() {
        return $this->computing_id;
    }

    public function getFirstName() {
        return $this->first_name;
    }

    public function getLastName() {
        return $this->last_name;
    }

    public function getPreferredName() {
        return $this->preferred_name;
    }

    public function getHashedPassword() {
        return $this->hashedPassword;
    }

    public function fromArray($data) {
        $this->computing_id = $data["computing_id"] ?? null;
        $this->first_name = $data["fname"] ?? null;
        $this->last_name = $data["lname"] ?? null;
        $this->preferred_name = $data["pname"] ?? null;
        $this->hashedPassword = $data["hashedPassword"] ?? null;
        return true;
    }

    public function toArray() {
        return array(
            "computing_id" => $this->computing_id,
            "fname" => $this->first_name,
            "lname" => $this->last_name,
            "pname" => $this->preferred_name,
            "hashedPassword" => $this->hashedPassword
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