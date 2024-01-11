<?php 

namespace asci\data;

class SelfMadeGroup implements \Serializable
{
    public $id;
    public $issue;
    public $location;
    public $creationTime;
    public $status;


    public function __construct()
    {
    }

    public function fromArray($data)
    {
        $this->id = $data['id'] ?? null;
        $this->issue = $data['issue'] ?? null;
        $this->location = $data['location'] ?? null;
        $this->creationTime = $data['creationTime'] ?? null;
        $this->status = $data['status'] ?? null;
        return $this;
    }

    public function toArray()
    {
        return array(
            "id" => $this->id,
            "issue" => $this->issue,
            "location" => $this->location,
            "creationTime" => $this->creationTime,
            "status" => $this->status
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