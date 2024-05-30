<?php

namespace asci\data;

class CourseQuest implements \Serializable {

    private $quest_id;
    private $course_id;
    private $name;
    private $description;
    private $total_points;


    public function __construct()
    {
        
    }

    // Getters
    public function getQuestId()
    {
        return $this->quest_id;
    }

    public function getCourseId()
    {
        return $this->course_id;
    }

    
    public function getName()
    {
        return $this->name;
    }

    public function getDescription()
    {
        return $this->description;
    }

    public function getTotalPoints()
    {
        return $this->total_points;
    }

    // Populate properties from an array
    public function fromArray($data)
    {
        $this->quest_id = $data['quest_id'] ?? null;
        $this->course_id = $data['course_id'] ?? null;
        $this->name = $data['name'] ?? null;
        $this->description = $data['description'] ?? null;
        $this->total_points = $data['total_points'] ?? null;
        return $this;
    }

    // Convert properties to an array
    public function toArray()
    {
        return array(
            "quest_id" => $this->quest_id,
            "course_id" => $this->course_id,
            "name" => $this->name,
            "description" => $this->description,
            "total_points" => $this->total_points,
        );
    }

    // Convert properties to JSON
    public function toJSON() {
        return json_encode($this->toArray(), JSON_PRETTY_PRINT);
    }

    // Populate properties from JSON
    public function fromJSON($json) {
        $data = json_decode($json, true);
        $return = $this->fromArray($data);
        unset($data);
        return $return;
    }

    // Serialize to JSON
    public function serialize() {
        return $this->toJSON();
    }

    // Unserialize from JSON
    public function unserialize($data) {
        $this->fromJSON($data);
    }

    // Optional: check if this is a valid assignment
    public function isValid() {
        return isset($this->id) && !empty($this->id);
    }
}