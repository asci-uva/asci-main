<?php

namespace asci\server\database;

use asci\data\Survey as Survey;

class DBSurvey
{
    /* Reference to the database connection */
    private $db;

    /**
     * @var \Monolog\Logger $logger Logger for this class
     */
    private $logger = null;

    public function __construct($db)
    {
        global $log;

        $this->db = $db;
        $this->logger = new \Monolog\Logger('DBUser');
        $this->logger->pushHandler($log);
    }

    public function write($survey){
        $query = 'INSERT INTO survey (
                        session_id,
                        user_id,
                        q1_score,
                        q2_score,
                        q3_score,
                        q4_score,
                        q5_score,
                        feedback )
                    VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8
                    )';
        $result = $this->db->query($query, array(
                        $survey->session_id,
                        $survey->user_id,
                        $survey->q1_score,
                        $survey->q2_score,
                        $survey->q3_score,
                        $survey->q4_score,
                        $survey->q5_score,
                        $survey->feedback
                    ));

        
        if($result) return true;
        else return false;
    }

    public function read($session_id, $user_id)
    {
        $query = 'select * from survey where session_id = $1 and user_id=$2';
        $result = $this->db->query($query, array($session_id, $user_id));

        $row = $this->db->fetchrow($result);

        $survey = new \asci\data\Survey();
        $survey->fromArray($row);

        return $survey;
    }

    
}
