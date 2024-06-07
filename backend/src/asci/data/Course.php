<?php

namespace asci\data;

class Course implements \Serializable
{
    public $id;
    public $mnemonic;
    public $number;
    public $name;
    public $semester;

    public function __construct($data)
    {
        $this->fromArray($data);
    }

    public function getId()
    {
        return $this->id;
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


    public function fromArray($data)
    {
        $this->id = $data['id'] ?? null;
        $this->mnemonic = $data['mnemonic'] ?? null;
        $this->number = $data['number'] ?? null;
        $this->name = $data['name'] ?? null;
        $this->semester = $data['semester'] ?? null;
        return $this;
    }

    public function toArray()
    {
        return array(
            "id" => $this->id,
            "mnemonic" => $this->mnemonic,
            "number" => $this->number,
            "name" => $this->name,
            "semester" => $this->semester,
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

    // check if there is a valid course found
    // public function isValid() {
    //     return isset($this->courseId) && !empty($this->courseId);
    // }    
}