<?php

namespace asci\server\database;

/*
 * Interacts with the database to track which external tools are enabled for a course.
 */
class DBExternalTools
{
    /* Reference to the database connection */
    private $db;

    /**
     * @var \Monolog\Logger $logger Logger for this class
     */
    private $logger = null;

    public static $TOOLS = ["canvas", "gradescope", "piazza"];

    public function __construct($db)
    {
        global $log;

        $this->db = $db;
        $this->logger = new \Monolog\Logger('DBExternalTools');
        $this->logger->pushHandler($log);
    }

    public static function isValidTool($tool) {
        return in_array($tool, self::$TOOLS, true);
    }

    public function getExternalTools($course_id) {
        $rows = $this->db->fetchall($this->db->query(
            'SELECT tool, enabled FROM course_external_tools WHERE course_id = $1',
            [$course_id]
        ));

        $tools = [];
        foreach (self::$TOOLS as $tool)
            $tools[$tool] = false;

        foreach ($rows ?: [] as $row) {
            if (self::isValidTool($row['tool']))
                $tools[$row['tool']] = $row['enabled'] === 't';
        }

        return $tools;
    }

    public function setExternalToolEnabled($course_id, $tool, $enabled) {
        $this->db->query(
            'INSERT INTO course_external_tools (course_id, tool, enabled, updated_at)
             VALUES ($1, $2, $3, now())
             ON CONFLICT (course_id, tool)
             DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = now()',
            [$course_id, $tool, $enabled ? 't' : 'f']
        );

        return $this->getExternalTools($course_id);
    }
}
