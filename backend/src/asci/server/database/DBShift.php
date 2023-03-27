<?php

namespace asci\server\database;

/*
 * Interacts with the database to fetch sessions and data about sessions.
 */
class DBShift
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
        $this->logger = new \Monolog\Logger('DBShift');
        $this->logger->pushHandler($log);
    }

    /*
     * Updates the shift with the provided one
     */
    public function update($session){
        $query = 'UPDATE shifts SET
            id = $1,
            user_id = $2,
            course_id = $3,
            start_time = $4,
            end_time = $5,
            WHERE id = $6';

        $result = $this->db->query($query, array(
            $session->getId(),
            $session->getUserId(),
            $session->getCourseId(),
            $session->getStartTime(),
            $session->getEndTime(),
            $session->getId(),
        ));

        if($result) return true;
        else return false;
    }


    /*
     * Gets a shift by shift_id
     */
    public function getShift($shift_id){
        $query = 'select * from shift where id=$1';

        $result = $this->db->query($query, array($shift_id));
        $shift = $this->db->fetchrow($result);

        if($shift == null){
            return null;
        }

        return (new \asci\data\Shift())->fromArray($shift);
    }

    /*
     * Fetches the most recent active shift for the given
     * userId courseId combination.
     *
     * RETURNS: Shift object
     */
    public function getShiftForUser($user_id, $course_id)
    {
        $query = 'select * from shifts where user_id=$1 and course_id=$2 and end_time >= NOW()';


        $result = $this->db->query($query, array($user_id, $course_id));
        $shift = $this->db->fetchrow($result);


        if($shift == null){
            return null;
        }
        else{

            return (new \asci\data\Shift())->fromArray($shift);
        }


    }

    /*
     * Creates a new shift for this TA in this course
     * 
     * Returns Shift object of new shift or null if none created
     */
    public function createNewShift($user_id, $course_id, $end_time){

        $query = 'insert into shifts (user_id, course_id, start_time, end_time) values ($1, $2, now(), $3) returning id';

        $result = $this->db->query($query, array($user_id, $course_id, $end_time));
        $id = $this->db->fetchrow($result)["id"];

        if($id == null){
            return null;
        }
        else{       

            return $this->getShiftForUser($user_id, $course_id);

        }

    }

    public function endShift($shift_id){
        $query = 'update shifts set end_time = NOW() where id = $1';

        $result = $this->db->query($query, array($shift_id));

        return true;
    }

    /*
     * Ends all shift associated with this user_id course combination
     * by setting each end_time to NOW()
     */
    public function endAllShifts($user_id, $course_id){

        $query = 'update shifts set end_time = NOW() from (select * from shifts where user_id = $1 and course_id = $2 and end_time >= NOW())';

        $result = $this->db->query($query, array($course_id, $user_id));
        
        return true;

    }

    /*
     * Closes all shifts associated with this user_id course combination
     * by setting each to "completed" EXCEPT the one provided
     */
    public function closeAllOtherShifts($user_id, $course_id, $shift_id){

        $query = 'update shifts set end_time = NOW() from (select * from shifts where $user_id = $1 and $course_id = $2 and end_time >= NOW() and id != $3)';

        $result = $this->db->query($query, array($course_id, $user_id, $shift_id));
        
        return true;

    }

    /*
     * Returns the number of TAs working in the course
     */
    public function getNumWorking($course_id){

        $query = 'select count(*) from shifts where course_id=$1 and end_time >= NOW()';

        $result = $this->db->query($query, array($course_id));
        $row = $this->db->fetchrow($result);

        if ($row != null){
            return $row;
        }
        
        return null;

    }   
   
}
