<?php 

namespace asci\data;

class SelfGroupMapping implements \Serializable
{
    public $session_id;
    public $group_id;
    public $status;


    public function __construct()
    {
    }

    public function fromArray($data)
    {
        $this->session_id = $data['session_id'] ?? null;
        $this->group_id = $data['group_id'] ?? null;
        $this->status = $data['status'] ?? null;
        return $this;
    }

    public function toArray()
    {
        return array(
            "session_id" => $this->session_id,
            "group_id" => $this->group_id,
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