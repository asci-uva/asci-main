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
        $this->first_name = $data["first_name"] ?? null;
        $this->last_name = $data["last_name"] ?? null;
        $this->preferred_name = $data["preferred_name"] ?? null;
        $this->hashedPassword = $data["hashedPassword"] ?? null;
        return true;
    }

    public function toArray($data) {
        return array(
            "computing_id" => $this->computing_id,
            "first_name" => $this->first_name,
            "last_name" => $this->last_name,
            "preferred_name" => $this->preferred_name,
            "hashedPassword" => $this->hashedPassword
        );
    }

    public function toJSON($shorten = true) {
        return json_encode($this->toArray($shorten), JSON_PRETTY_PRINT);
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