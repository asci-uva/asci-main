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
          and (u.role='instructor' or u.role='ta') 
          and s.status = 'completed' and fulfillment_time is not null
          and u.course_id = $1 and ut.id = u.user_id $limit) s 
      group by user_id, pname, lname order by time desc;";

    $result = null;
    if ($threshold === null)
      $result = $this->db->query($query, array($course_id));
    else
      $result = $this->db->query($query, array($course_id, $threshold));

    $stats = $this->db->fetchall($result);

    return $stats;
  }

}
