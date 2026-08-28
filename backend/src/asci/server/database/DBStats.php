<?php
namespace asci\server\database;

use asci\data\User as User;

class DBStats {
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
    $this->logger = new \Monolog\Logger('DBStats');
    $this->logger->pushHandler($log);
  }

  public function getTAHelpStatsForCourse($course_id, $threshold = null)
  {
    $limit = "";
    if ($threshold !== null)
      $limit = "and s.exit_time > $2 ";

    $query = "select user_id, pname || ' ' || lname as name, 
      round(extract(epoch from sum(exit_time - fulfillment_time)) / 60, 2) as time,
      count(*) as num_sessions 
      from 
        (select distinct u.user_id, ut.pname, ut.lname, s.* from 
          sessions s, session_users su, user_courses u, users ut 
          where s.id = su.session_id and su.user_id = u.user_id 
          and u.role in ('instructor', 'primary_instructor', 'ta')
          and s.status = 'completed' and fulfillment_time is not null
          and u.course_id = $1 and s.course_id = $1
          and ut.id = u.user_id $limit) s 
      group by user_id, pname, lname order by time desc;";

    $result = null;
    if ($threshold === null)
      $result = $this->db->query($query, array($course_id));
    else
      $result = $this->db->query($query, array($course_id, $threshold));

    $stats = $this->db->fetchall($result);

    return $stats;
  }
  
  public function getTAActiveQueueStatsForCourse($course_id, $start_time = null, $end_time = null)
  {

    // Get when all the TAs were logged into the system in the given time period.
    $limit = "";
    if ($start_time !== null)
      $limit = "and a.entry_time >= $2 ";
    if ($end_time !== null)
      $limit .= "and a.exit_time <= $3 ";

    $query = "select a.user_id, u.pname || ' ' || u.lname as name, 
      to_char(a.entry_time, 'YYYY-MM-DD\"T\"HH24:MI:SS') as entry_time, 
      to_char(a.exit_time, 'YYYY-MM-DD\"T\"HH24:MI:SS') as exit_time 
      from users u, ta_activity a 
      where u.id = a.user_id and a.course_id = $1 $limit
      order by a.entry_time asc;";

    $result = null;
    if ($start_time === null)
      $result = $this->db->query($query, array($course_id));
    else if ($end_time === null)
      $result = $this->db->query($query, array($course_id, $start_time));
    else 
      $result = $this->db->query($query, array($course_id, $start_time, $end_time));

    $activityPeriods = $this->db->fetchall($result);
    
    // Get all TA actions 
    $limit = "";
    if ($start_time !== null)
      $limit = "and s.fulfillment_time >= $2 ";
    if ($end_time !== null)
      $limit .= "and s.fulfillment_time <= $3 ";

    $query = "select su.user_id, to_char(s.fulfillment_time, 'YYYY-MM-DD\"T\"HH24:MI:SS') as fulfillment_time
      from session_users su, sessions s 
      where s.course_id = $1 and s.id = su.session_id 
        and su.role in ('instructor', 'primary_instructor', 'ta') $limit
      order by s.fulfillment_time asc;";

    $result = null;
    if ($start_time === null)
      $result = $this->db->query($query, array($course_id));
    else if ($end_time === null)
      $result = $this->db->query($query, array($course_id, $start_time));
    else 
      $result = $this->db->query($query, array($course_id, $start_time, $end_time));

    $interactions = $this->db->fetchall($result);

    // Get a list of TAs from the database as an array
    $query = "select uc.user_id, u.pname || ' ' || u.lname as name, u.computing_id
      from users u, user_courses uc 
      where u.id = uc.user_id and uc.course_id = $1
      and uc.role in ('instructor', 'primary_instructor', 'ta')
      order by name asc;";

    $result = $this->db->query($query, array($course_id));
    $tas_list = $this->db->fetchall($result);
    $tas = [];
    foreach ($tas_list as $ta) {
      $tas[$ta["user_id"]] = $ta;
      $tas[$ta["user_id"]]["activity"] = [];
      $tas[$ta["user_id"]]["interactions"] = [];
    }

    foreach ($activityPeriods as $k => $v) {
      $activityPeriods[$k]["interactions"] = 0;
      foreach ($interactions as $interact) {
        // clean up as needed...
        if ($interact["user_id"] == $v["user_id"] && 
          $interact["fulfillment_time"] > $v["entry_time"] &&
          $interact["fulfillment_time"] < $v["exit_time"]) {
          $activityPeriods[$k]["interactions"]++;
          array_push($tas[$v["user_id"]]["interactions"], $interact);
        }
      }
      // Add the activity periods to each TA so we can display them that way too
      // todo
      array_push($tas[$v["user_id"]]["activity"], $activityPeriods[$k]);
    }

    // Return TAs and activityPeriods todo
    return ["tas" => $tas, "activities" => $activityPeriods];
  }

}
