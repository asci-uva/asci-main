<?php

namespace asci\data;

class Assignment implements \Serializable
{
    private $id;
    private $course_id;
    private $name;
    private $description;
    private $due_date;
    private $max_score;
    private $type;

    public function __construct($data)
    {
        $this->fromArray($data);
    }

    // Getters
    public function getId()
    {
        return $this->id;
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

    public function getDueDate()
    {
        return $this->due_date;
    }

    public function getMaxScore()
    {
        return $this->max_score;
    }

    public function getType()
    {
        return $this->type;
    }

    // Populate properties from an array
    public function fromArray($data)
    {
        $this->id = $data['id'] ?? null;
        $this->course_id = $data['course_id'] ?? null;
        $this->name = $data['name'] ?? null;
        $this->description = $data['description'] ?? null;
        $this->due_date = $data['due_date'] ?? null;
        $this->max_score = $data['max_score'] ?? null;
        $this->type = $data['type'] ?? null;
        return $this;
    }

    // Convert properties to an array
    public function toArray()
    {
        return array(
            "id" => $this->id,
            "course_id" => $this->course_id,
            "name" => $this->name,
            "description" => $this->description,
            "due_date" => $this->due_date,
            "max_score" => $this->max_score,
            "type" => $this->type,
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
