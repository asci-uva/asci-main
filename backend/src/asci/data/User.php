<?php

namespace asci\data;

class User implements \Serializable {

    private $id;
    private $computing_id;
    private $fname;
    private $lname;
    private $pname;


    public function __construct()
    {
        
        
    }

    public function fromData($id, $computing_id, $fname, $lname, $pname){
        $this->id = $id;
        $this->computing_id = $computing_id;
        $this->fname = $fname;
        $this->lname = $lname;
        $this->pname = $pname;
    }

    public function fromArray($row){
        $this->id = $row['id'] ?? null;
        $this->computing_id = $row['computing_id'] ?? null;
        $this->fname = $row['fname'] ?? null;
        $this->lname = $row['lname'] ?? null;
        $this->pname = $row['pname'] ?? null;
        return $this;
    }

    public function toArray() {
        return array(
            "id" => $this->id,
            "computing_id" => $this->computing_id,
            "fname" => $this->fname,
            "lname" => $this->lname,
            "pname" => $this->pname
        );
    }


    public function getId()
    {
        return $this->id;
    }

    public function getComputingId()
    {
        return $this->computing_id;
    }

    public function getFName()
    {
        return $this->fname;
    }

    public function getLName()
    {
        return $this->lname;
    }

    public function getPName()
    {
        return $this->pname;
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