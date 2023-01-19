<?php

namespace asci\server;

use asci\server\database\DatabaseConnector;

class User
{
    public $DB;

    public function __construct($db)
    {
        $this->DB = $db;

        $this->DB->prepare("exists", "
            SELECT COUNT(*) FROM users WHERE computing_id = $1;
        ");

        $this->DB->prepare("register", "
            INSERT INTO users (computing_id, password) VALUES ($1, $2);
        ");
    }

    public function userExists($userid)
    {
        $psqlObject = $this->DB->execute("exists", [$userid]);
        $results = $this->DB->fetchRow($psqlObject);
        return $results["count"] != 0 ? true : false;
    }

    /**
     * Registers a user by adding their userid/password to the db
     * 
     * @param string $userid the computing id of the student
     * @param string $password the clear text password of the student which gets hashed with BCRYPT
     */
    public function register($userid, $pass)
    {
        if ($this->userExists($userid)) {
            return [
                "response" => [
                    "success" => false,
                    "reason" => "user already exists"
                ]
            ];
        } else {
            $hashedPassword = password_hash($pass, PASSWORD_DEFAULT);
            $psqlObject = $this->DB->execute("register", [$userid, $hashedPassword]);
            $results = $this->DB->fetchRow($psqlObject);
            if (!$results) {
                return [
                    "response" => [
                        "success" => true,
                        "reason" => ""
                    ]
                ];
            } else {
                return [
                    "response" => [
                        "success" => false,
                        "reason" => "failed to insert user into the database"
                    ]
                ];
            }
        }
    }

}
?>
