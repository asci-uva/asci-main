<?php

namespace asci\server\database;

class DBCanvasAssignment
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
        $this->logger = new \Monolog\Logger('DBCanvasAssignment');
        $this->logger->pushHandler($log);
    }

    private static $SELECT_COLUMNS =
        'id, asci_course_id, canvas_assignment_id, canvas_assignment_group_id, name, description,
         html_url, due_at, unlock_at, lock_at, points_possible, grading_type, submission_types,
         allowed_attempts, position, published, workflow_state, omit_from_final_grade,
         canvas_created_at, canvas_updated_at, last_synced_at, missing_from_canvas_at';

    public function getAssignmentsByCourseId($asci_course_id) {
        $result = $this->db->query(
            'SELECT ' . self::$SELECT_COLUMNS . '
             FROM canvas_lms_assignments
             WHERE asci_course_id = $1
             ORDER BY position NULLS LAST, id',
            [$asci_course_id]
        );

        $assignments = [];
        while ($row = $this->db->fetchRow($result)) {
            $assignments[] = $this->normalizeRow($row);
        }

        return $assignments;
    }

    public function getAssignmentByCanvasId($asci_course_id, $canvas_assignment_id) {
        $row = $this->db->fetchRow($this->db->query(
            'SELECT ' . self::$SELECT_COLUMNS . '
             FROM canvas_lms_assignments
             WHERE asci_course_id = $1 AND canvas_assignment_id = $2',
            [$asci_course_id, (string)$canvas_assignment_id]
        ));

        return $row ? $this->normalizeRow($row) : false;
    }

    public function upsertAssignment($asci_course_id, $canvasAssignment) {
        $params = $this->canvasAssignmentToRow($asci_course_id, $canvasAssignment);
        if ($params === null) {
            $this->logger->error("Canvas assignment payload has no id, skipping", ["course" => $asci_course_id]);
            return false;
        }

        $row = $this->db->fetchRow($this->db->query(
            'INSERT INTO canvas_lms_assignments (
                asci_course_id, canvas_assignment_id, canvas_assignment_group_id, name, description,
                html_url, due_at, unlock_at, lock_at, points_possible, grading_type, submission_types,
                allowed_attempts, position, published, workflow_state, omit_from_final_grade,
                canvas_created_at, canvas_updated_at, last_synced_at
             ) VALUES (
                $1, $2, $3, $4, $5,
                $6,
                $7::timestamptz AT TIME ZONE current_setting(\'TimeZone\'),
                $8::timestamptz AT TIME ZONE current_setting(\'TimeZone\'),
                $9::timestamptz AT TIME ZONE current_setting(\'TimeZone\'),
                $10, $11, $12,
                $13, $14, $15, $16, $17,
                $18::timestamptz AT TIME ZONE current_setting(\'TimeZone\'),
                $19::timestamptz AT TIME ZONE current_setting(\'TimeZone\'),
                now()
             )
             ON CONFLICT (asci_course_id, canvas_assignment_id) DO UPDATE SET
                canvas_assignment_group_id = EXCLUDED.canvas_assignment_group_id,
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                html_url = EXCLUDED.html_url,
                due_at = EXCLUDED.due_at,
                unlock_at = EXCLUDED.unlock_at,
                lock_at = EXCLUDED.lock_at,
                points_possible = EXCLUDED.points_possible,
                grading_type = EXCLUDED.grading_type,
                submission_types = EXCLUDED.submission_types,
                allowed_attempts = EXCLUDED.allowed_attempts,
                position = EXCLUDED.position,
                published = EXCLUDED.published,
                workflow_state = EXCLUDED.workflow_state,
                omit_from_final_grade = EXCLUDED.omit_from_final_grade,
                canvas_created_at = EXCLUDED.canvas_created_at,
                canvas_updated_at = EXCLUDED.canvas_updated_at,
                last_synced_at = EXCLUDED.last_synced_at,
                missing_from_canvas_at = NULL
             RETURNING id',
            $params
        ));

        return $row ? $row['id'] : false;
    }

    public function syncAssignments($asci_course_id, $canvasAssignments) {
        $added = 0;
        $updated = 0;
        $skipped = 0;
        $seen = [];

        $this->db->beginTransaction();

        $existing = [];
        $result = $this->db->query(
            'SELECT canvas_assignment_id FROM canvas_lms_assignments WHERE asci_course_id = $1',
            [$asci_course_id]
        );
        while ($row = $this->db->fetchRow($result)) {
            $existing[$row['canvas_assignment_id']] = true;
        }

        foreach ($canvasAssignments as $canvasAssignment) {
            if (!isset($canvasAssignment['id'])) {
                $skipped += 1;
                continue;
            }

            $canvas_assignment_id = (string)$canvasAssignment['id'];
            $seen[$canvas_assignment_id] = true;

            if ($this->upsertAssignment($asci_course_id, $canvasAssignment) === false) {
                $skipped += 1;
            } else if (isset($existing[$canvas_assignment_id])) {
                $updated += 1;
            } else {
                $added += 1;
            }
        }

        $guarded = count($seen) === 0 && count($existing) > 0;

        $flagged = 0;
        if (!$guarded) {
            foreach (array_keys($existing) as $canvas_assignment_id) {
                if (isset($seen[$canvas_assignment_id]))
                    continue;

                $this->db->query(
                    'UPDATE canvas_lms_assignments
                     SET missing_from_canvas_at = COALESCE(missing_from_canvas_at, now())
                     WHERE asci_course_id = $1 AND canvas_assignment_id = $2',
                    [$asci_course_id, $canvas_assignment_id]
                );
                $flagged += 1;
            }
        }

        $this->db->commit();

        return [
            'added' => $added,
            'updated' => $updated,
            'flagged' => $flagged,
            'guarded' => $guarded,
            'skipped' => $skipped
        ];
    }

    public function deleteFlaggedAssignment($asci_course_id, $canvas_assignment_id) {
        $this->db->beginTransaction();

        $row = $this->db->fetchRow($this->db->query(
            'SELECT id FROM canvas_lms_assignments
             WHERE asci_course_id = $1 AND canvas_assignment_id = $2
               AND missing_from_canvas_at IS NOT NULL
             FOR UPDATE',
            [$asci_course_id, (string)$canvas_assignment_id]
        ));

        if (!$row) {
            $this->db->commit();
            return false;
        }

        $result = $this->db->query(
            'DELETE FROM canvas_lms_submissions WHERE canvas_lms_assignment_id = $1',
            [$row['id']]
        );
        $submissions = $this->db->affectedRows($result);

        $this->db->query('DELETE FROM canvas_lms_assignments WHERE id = $1', [$row['id']]);

        $this->db->commit();

        return $submissions;
    }

    public function deleteAssignmentsByCourseId($asci_course_id) {
        $result = $this->db->query(
            'DELETE FROM canvas_lms_assignments WHERE asci_course_id = $1',
            [$asci_course_id]
        );

        return $this->db->affectedRows($result);
    }

    private function canvasAssignmentToRow($asci_course_id, $canvasAssignment) {
        if (!isset($canvasAssignment['id']))
            return null;

        $field = function ($key) use ($canvasAssignment) {
            return isset($canvasAssignment[$key]) ? $canvasAssignment[$key] : null;
        };
        $text = function ($key) use ($canvasAssignment) {
            return isset($canvasAssignment[$key]) ? (string)$canvasAssignment[$key] : null;
        };

        return [
            $asci_course_id,
            (string)$canvasAssignment['id'],
            $text('assignment_group_id'),
            $field('name'),
            $field('description'),
            $field('html_url'),
            $field('due_at'),
            $field('unlock_at'),
            $field('lock_at'),
            $field('points_possible'),
            $field('grading_type'),
            $this->toPgArray($field('submission_types')),
            $field('allowed_attempts'),
            $field('position'),
            $this->toPgBool($field('published')),
            $field('workflow_state'),
            $this->toPgBool($field('omit_from_final_grade')),
            $field('created_at'),
            $field('updated_at')
        ];
    }

    private function toPgBool($value) {
        if ($value === null)
            return null;

        return $value ? 't' : 'f';
    }

    private function toPgArray($value) {
        if ($value === null)
            return null;
        if (!is_array($value))
            $value = [$value];

        $quoted = array_map(function ($item) {
            return '"' . str_replace(['\\', '"'], ['\\\\', '\\"'], (string)$item) . '"';
        }, $value);

        return '{' . implode(',', $quoted) . '}';
    }

    private function fromPgArray($value) {
        if ($value === null || $value === '{}')
            return [];

        return str_getcsv(trim($value, '{}'));
    }

    private function normalizeRow($row) {
        $row['submission_types'] = $this->fromPgArray($row['submission_types']);

        return $row;
    }
}
