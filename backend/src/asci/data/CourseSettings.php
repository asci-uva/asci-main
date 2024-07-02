<?php

namespace asci\data;

class CourseSettings implements \Serializable
{
    public $course_id;
    public $show_queue_list;
    public $grouping_enabled;
    public $smart_grouping;
    public $show_quests;

    public function __construct()
    {
        
    }

    public function fromArray($data)
    {
        $this->course_id = $data['course_id'] ?? null;
        $this->show_queue_list = $data['show_queue_list'] ?? null;
        $this->grouping_enabled = $data['grouping_enabled'] ?? null;
        $this->smart_grouping = $data['smart_grouping'] ?? null;
        $this->show_quests = $data['show_quests'] ?? null;
        return $this;
    }

    public function toArray()
    {
        return array(
            "course_id" => $this->course_id,
            "show_queue_list" => $this->show_queue_list,
            "grouping_enabled" => $this->grouping_enabled,
            "smart_grouping" => $this->smart_grouping,            
            "show_quests" => $this->show_quests
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