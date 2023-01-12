<?php

namespace asci\server\database;

/**
 * SQL Class
 * 
 * Keep all low level SQL methods in this class.
 * 
 */

class SQL
{
    private $sdb = null;

    private $logger;

    public function __construct($db)
    {
        $this->sdb = $db;
        $this->enableLogging();
    }

    public function enableLogging()
    {
        global $log;
        if (!$this->logger) {
            // create a log channel
            $this->logger = new \Monolog\Logger('SQL');
            $this->logger->pushHandler($log);
        }
    }

    private function logDebug($msg, $debugArray)
    {
        if ($this->logger) {
            $this->logger->addDebug($msg, $debugArray);
        }
    }

    public function getUser($computing_id)
    {
        $result = $this->sdb->query(
            'select count(*) from users where computing_id = $1',
            array($computing_id)
        );
        $row = $this->sdb->fetchrow($result);
        return $row;
    }

    public function insertUser(
        $computing_id,
        $fname,
        $lname,
        $pname,
        $password
    )
    {
        $result = $this->sdb->query(
            'insert into users 
            (computing_id, fname, lname, 
            pname, password) 
            values ($1, $2, $3, $4, $5) returning id',
            array(
                $computing_id,
                $fname,
                $lname,
                $pname,
                $password
            )
        );
        $row = $this->sdb->fetchrow($result);
        return $row;
    }

    public function insertCourse(
        $mnemonic,
        $number,
        $name,
        $semester
    )
    {
        $result = $this->sdb->query(
            'insert into courses (mnemonic, number, name, semester)
            values($1, $2, $3, $4) returning id',
            array(
                $mnemonic,
                $number,
                $name,
                $semester
            )
        );
        $row = $this->sdb->fetchrow($result);
        return $row;
    }

    public function joinQueue($userid, $courseid, $issue, $issue_subject)
    {
        $result = $this->sdb->query(
            'insert into queue (user_id, course_id, issue, issue_subject, status)
            values ($1, $2, $3, $4, $5) returning id',
            array($userid, $courseid, $issue, $issue_subject, "waiting")
        );
        $row = $this->sdb->fetchrow($result);
        return $this->getQueuePosition((int)$row["id"], $courseid);
    }

    /**
     * Adds a user to the queue of a course's office hours
     * 
     * @param int $queueid ID of row in queue table
     * @param int $courseid ID of course in course table
     * 
     * @return string[] position of the user in the queue
     */
    public function getQueuePosition($queueid, $courseid)
    {
        $result = $this->sdb->query(
            'select count(*) as position from queue
            where id < $1 and course_id = $2 and status = $3',
            array($queueid, $courseid, 'waiting')
        );
        $row = $this->sdb->fetchrow($result);
        $row["position"] += 1;
        return $row;
    }

    public function leaveQueue($userid) {
        $result = $this->sdb->query(
            'update queue set status = $1, exit_time = NOW() where user_id = $2 and status = $3',
            array('completed', $userid, 'waiting')
        );
        return $this->sdb->fetchrow($result);
    }
}