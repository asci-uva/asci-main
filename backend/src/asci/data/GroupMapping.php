<?php

namespace asci\data;

class GroupMapping implements \Serializable
{
    public $from_session;
    public $to_session;
    public $status;

    public function __construct()
    {
    }

    public function getFromSession()
    {
        return $this->from_session;
    }

    public function getToSession()
    {
        return $this->to_session;
    }

    public function getStatus()
    {
        return $this->status;
    }

    public function fromArray($data)
    {
        $this->from_session = $data['from_session'] ?? null;
        $this->to_session = $data['to_session'] ?? null;
        $this->status = $data['status'] ?? null;
        return $this;
    }

    public function toArray()
    {
        return array(
            "from_session" => $this->from_session,
            "to_session" => $this->to_session,
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