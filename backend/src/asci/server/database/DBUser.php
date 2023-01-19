<?php

namespace asci\server\database;

class DBUser
{
    /**
     * SQL object
     *
     * @var \asci\server\database\SQL low-level SQL class
     */
    private $sql = null;

    /**
     * @var \Monolog\Logger $logger Logger for this class
     */
    private $logger = null;

    public function __construct($db)
    {
        global $log;

        $this->sql = new \asci\server\database\SQL($db);
        $this->logger = new \Monolog\Logger('DBUser');
        $this->logger->pushHandler($log);
    }

    public function getUser($computing_id)
    {
        $result = $this->sql->getUser($computing_id);
        return $result["count"] != 0 ? true : false;
    }

    public function createUser($user)
    {
        if (!$this->getUser($user->getComputingID())) {
            $result = $this->sql->insertUser(
                $user->getComputingID(),
                $user->getFirstName(),
                $user->getLastName(),
                $user->getPreferredName(),
                $user->getHashedPassword()
            );
            return $result;
        } else {
            return false;
        }
    }

    public function createCourse($course)
    {
        $result = $this->sql->insertCourse(
            $course->getMnemonic(),                
            $course->getNumber(),
            $course->getName(),
            $course->getSemester()
        );
        return $result;
    }

    public function joinQueue($userid, $courseid, $issue, $issue_subject) {
        return $this->sql->joinQueue($userid, $courseid, $issue, $issue_subject);
    }

    public function leaveQueue($userid) {
        return $this->sql->leaveQueue($userid);
    }
}
