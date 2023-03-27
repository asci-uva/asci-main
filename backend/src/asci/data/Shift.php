<?php

namespace asci\data;

class Shift implements \Serializable
{

    public $id;
    public $user_id;
    public $course_id;
    public $start_time;
    public $end_time;


    public function __construct()
    {


    }

    public function fromArray($row)
    {

        $this->id = $row['id'] ?? null;
        $this->user_id = $row['user_id'] ?? null;
        $this->course_id = $row['course_id'] ?? null;
        $this->start_time = $row['start_time'] ?? null;
        $this->end_time = $row['end_time'] ?? null;

        return $this;

    }

    public function toArray()
    {
        return array(
            "id" => $this->id,
            "user_id" => $this->user_id,
            "course_id" => $this->course_id,
            "start_time" => $this->start_time,
            "end_time" => $this->end_time
        );
    }


    public function getId()
    {
        return $this->id;
    }
    public function getUserId()
    {
        return $this->user_id;
    }
    public function getCourseId()
    {
        return $this->course_id;
    }
    public function getStartTime()
    {
        return $this->start_time;
    }
    public function getEndTime()
    {
        return $this->end_time;
    }





    public function toJSON()
    {
        return json_encode($this->toArray(), JSON_PRETTY_PRINT);
    }

    public function fromJSON($json)
    {
        $data = json_decode($json, true);
        $return = $this->fromArray($data);
        unset($data);
        return $return;
    }

    public function serialize()
    {
        return $this->toJSON();
    }

    public function unserialize($data)
    {
        $this->fromJSON($data);
    }
}