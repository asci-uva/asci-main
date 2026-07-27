<?php

namespace asci\server\database;

class DBCourseExternalTools
{
    const KNOWN_TOOLS = array('canvas', 'gradescope');

    private $db;
    private $logger = null;

    public function __construct($db)
    {
        global $log;

        $this->db = $db;
        $this->logger = new \Monolog\Logger('DBCourseExternalTools');
        $this->logger->pushHandler($log);
    }

    public function isEnabled($course_id, $tool){
        $query = 'SELECT enabled FROM course_external_tools WHERE course_id=$1 AND tool=$2';
        $result = $this->db->query($query, array($course_id, $tool));
        $row = $this->db->fetchRow($result);

        if ($row == null) return false;
        return $this->normalizeBool($row['enabled']);
    }

    public function getExternalTools($course_id){
        $query = 'SELECT tool, enabled FROM course_external_tools WHERE course_id=$1';
        $result = $this->db->query($query, array($course_id));
        $rows = $this->db->fetchAllRowsAsArray($result);

        $enabledByTool = array();
        foreach ($rows as $row) {
            $enabledByTool[$row['tool']] = $this->normalizeBool($row['enabled']);
        }

        $externalTools = array();
        foreach (self::KNOWN_TOOLS as $tool) {
            $externalTools[$tool] = array(
                'enabled' => isset($enabledByTool[$tool]) ? $enabledByTool[$tool] : false
            );
        }

        return $externalTools;
    }

    public function setEnabled($course_id, $tool, $enabled){
        $boolParam = function($v) {
            if ($v === true || $v === 't' || $v === 'true' || $v === '1' || $v === 1) return 't';
            return 'f';
        };

        $query = 'INSERT INTO course_external_tools (course_id, tool, enabled, updated_at)
            VALUES ($1, $2, $3, now())
            ON CONFLICT (course_id, tool)
            DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = now()';

        $result = $this->db->query($query, array($course_id, $tool, $boolParam($enabled)));

        if($result) return true;
        else return false;
    }

    private function normalizeBool($v){
        return ($v === true || $v === 't' || $v === 'true' || $v === '1' || $v === 1);
    }
}
