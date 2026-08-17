<?php

namespace asci\server\database;

class DBCanvasSubmission
{
    /* Reference to the database connection */
    private $db;

    /**
     * @var \Monolog\Logger $logger Logger for this class
     */
    private $logger = null;

    /* Marks which source last wrote a row */
    const SOURCE_SYNC = 'canvas_sync';
    const SOURCE_CSV = 'csv_upload';

    public function __construct($db)
    {
        global $log;

        $this->db = $db;
        $this->logger = new \Monolog\Logger('DBCanvasSubmission');
        $this->logger->pushHandler($log);
    }

    private static $SELECT_COLUMNS =
        'id, canvas_lms_assignment_id, canvas_user_id, user_id, canvas_submission_id,
         score, submitted_at, lateness, workflow_state, attempt, source,
         last_synced_at, last_uploaded_at';

    public function getSubmissionsByAssignmentId($canvas_lms_assignment_id) {
        $result = $this->db->query(
            'SELECT ' . self::$SELECT_COLUMNS . '
             FROM canvas_lms_submissions
             WHERE canvas_lms_assignment_id = $1
             ORDER BY user_id NULLS LAST, id',
            [$canvas_lms_assignment_id]
        );

        $submissions = [];
        while ($row = $this->db->fetchRow($result)) {
            $submissions[] = $row;
        }

        return $submissions;
    }

    public function getSubmissionsByCourseId($asci_course_id) {
        $result = $this->db->query(
            'SELECT s.id, s.canvas_lms_assignment_id, s.canvas_user_id, s.user_id,
                    s.canvas_submission_id, s.score, s.submitted_at, s.lateness,
                    s.workflow_state, s.attempt, s.source, s.last_synced_at, s.last_uploaded_at,
                    a.canvas_assignment_id, a.name AS assignment_name, a.points_possible,
                    u.computing_id, u.fname, u.lname
             FROM canvas_lms_submissions s
             JOIN canvas_lms_assignments a ON a.id = s.canvas_lms_assignment_id
             LEFT JOIN users u ON u.id = s.user_id
             WHERE a.asci_course_id = $1
             ORDER BY a.position NULLS LAST, a.id, u.lname NULLS LAST, u.fname, s.id',
            [$asci_course_id]
        );

        $submissions = [];
        while ($row = $this->db->fetchRow($result)) {
            $submissions[] = $row;
        }

        return $submissions;
    }

    public function syncSubmissions($asci_course_id, $canvasSubmissions) {
        $added = 0;
        $updated = 0;
        $skipped = 0;

        $this->db->beginTransaction();

        $assignment_ids = $this->assignmentIdsByCanvasId($asci_course_id);

        foreach ($canvasSubmissions as $canvasSubmission) {
            $values = $this->canvasSubmissionToValues($asci_course_id, $canvasSubmission, $assignment_ids);
            if ($values === null) {
                $skipped += 1;
                continue;
            }

            if ($this->writeSubmission($values, self::SOURCE_SYNC))
                $added += 1;
            else
                $updated += 1;
        }

        $this->db->commit();

        return [
            'added' => $added,
            'updated' => $updated,
            'skipped' => $skipped
        ];
    }

    public function importSubmissions($asci_course_id, $canvas_lms_assignment_id, $rows) {
        $imported = 0;
        $updated = 0;
        $skipped = 0;

        $this->db->beginTransaction();

        foreach ($rows as $row) {
            $user_id = $this->resolveAsciUserId(
                $asci_course_id,
                isset($row['computing_id']) ? $row['computing_id'] : null,
                isset($row['email']) ? $row['email'] : null
            );
            if ($user_id === null) {
                $skipped += 1;
                continue;
            }

            $values = [
                'canvas_lms_assignment_id' => $canvas_lms_assignment_id,
                'canvas_user_id' => null,
                'user_id' => $user_id,
                'canvas_submission_id' => null,
                'score' => $this->toNumeric(isset($row['score']) ? $row['score'] : null),
                'submitted_at' => $this->blankToNull(isset($row['submitted_at']) ? $row['submitted_at'] : null),
                'lateness' => $this->blankToNull(isset($row['lateness']) ? $row['lateness'] : null),
                'workflow_state' => null,
                'attempt' => null
            ];

            if ($values['score'] === null && $values['submitted_at'] === null &&
                ($values['lateness'] === null || $this->isZeroInterval($values['lateness']))) {
                $skipped += 1;
                continue;
            }

            if ($this->writeSubmission($values, self::SOURCE_CSV))
                $imported += 1;
            else
                $updated += 1;
        }

        $this->db->commit();

        return [
            'imported' => $imported,
            'updated' => $updated,
            'skipped' => $skipped
        ];
    }

    public function deleteSubmissionsByAssignmentId($canvas_lms_assignment_id) {
        $result = $this->db->query(
            'DELETE FROM canvas_lms_submissions WHERE canvas_lms_assignment_id = $1',
            [$canvas_lms_assignment_id]
        );

        return $this->db->affectedRows($result);
    }

    private function writeSubmission($values, $source) {
        $params = [
            $values['canvas_lms_assignment_id'],
            $values['canvas_user_id'],
            $values['user_id'],
            $values['canvas_submission_id'],
            $values['score'],
            $values['submitted_at'],
            $values['lateness'],
            $values['workflow_state'],
            $values['attempt'],
            $source
        ];

        $existing_id = $this->findSubmissionId(
            $values['canvas_lms_assignment_id'],
            $values['canvas_user_id'],
            $values['user_id']
        );

        if ($existing_id === null) {
            $this->db->query(
                'INSERT INTO canvas_lms_submissions (
                    canvas_lms_assignment_id, canvas_user_id, user_id, canvas_submission_id,
                    score, submitted_at, lateness, workflow_state, attempt, source,
                    last_synced_at, last_uploaded_at
                 ) VALUES (
                    $1, $2, $3, $4,
                    $5::numeric,
                    $6::timestamptz AT TIME ZONE current_setting(\'TimeZone\'),
                    $7::interval,
                    $8, $9, $10,
                    CASE WHEN $10 = \'' . self::SOURCE_SYNC . '\' THEN now() END,
                    CASE WHEN $10 = \'' . self::SOURCE_CSV . '\' THEN now() END
                 )',
                $params
            );

            return true;
        }

        $params[] = $existing_id;
        $this->db->query(
            'UPDATE canvas_lms_submissions SET
                canvas_user_id = COALESCE($2, canvas_user_id),
                user_id = COALESCE($3, user_id),
                canvas_submission_id = COALESCE($4, canvas_submission_id),
                score = COALESCE($5::numeric, score),
                submitted_at = COALESCE($6::timestamptz AT TIME ZONE current_setting(\'TimeZone\'), submitted_at),
                lateness = COALESCE($7::interval, lateness),
                workflow_state = COALESCE($8, workflow_state),
                attempt = COALESCE($9, attempt),
                source = $10,
                last_synced_at = CASE WHEN $10 = \'' . self::SOURCE_SYNC . '\' THEN now() ELSE last_synced_at END,
                last_uploaded_at = CASE WHEN $10 = \'' . self::SOURCE_CSV . '\' THEN now() ELSE last_uploaded_at END
             WHERE id = $11 AND canvas_lms_assignment_id = $1',
            $params
        );

        return false;
    }

    private function findSubmissionId($canvas_lms_assignment_id, $canvas_user_id, $user_id) {
        $row = $this->db->fetchRow($this->db->query(
            'SELECT id FROM canvas_lms_submissions
             WHERE canvas_lms_assignment_id = $1
               AND (canvas_user_id = $2 OR user_id = $3)
             ORDER BY id
             LIMIT 1',
            [$canvas_lms_assignment_id, $canvas_user_id, $user_id]
        ));

        return $row ? $row['id'] : null;
    }

    private function assignmentIdsByCanvasId($asci_course_id) {
        $result = $this->db->query(
            'SELECT id, canvas_assignment_id FROM canvas_lms_assignments WHERE asci_course_id = $1',
            [$asci_course_id]
        );

        $ids = [];
        while ($row = $this->db->fetchRow($result)) {
            $ids[$row['canvas_assignment_id']] = $row['id'];
        }

        return $ids;
    }

    private function canvasSubmissionToValues($asci_course_id, $canvasSubmission, $assignment_ids) {
        if (!isset($canvasSubmission['assignment_id']) || !isset($canvasSubmission['user_id']))
            return null;

        $canvas_assignment_id = (string)$canvasSubmission['assignment_id'];
        if (!isset($assignment_ids[$canvas_assignment_id])) {
            $this->logger->error("Canvas submission references an unsynced assignment, skipping", [
                "canvas_assignment_id" => $canvas_assignment_id
            ]);
            return null;
        }

        $field = function ($key) use ($canvasSubmission) {
            return isset($canvasSubmission[$key]) ? $canvasSubmission[$key] : null;
        };

        $login_id = isset($canvasSubmission['user']['login_id']) ? $canvasSubmission['user']['login_id'] : null;

        return [
            'canvas_lms_assignment_id' => $assignment_ids[$canvas_assignment_id],
            'canvas_user_id' => (string)$canvasSubmission['user_id'],
            'user_id' => $this->resolveAsciUserId($asci_course_id, $login_id, null),
            'canvas_submission_id' => $field('id') === null ? null : (string)$canvasSubmission['id'],
            'score' => $this->toNumeric($field('score')),
            'submitted_at' => $field('submitted_at'),
            'lateness' => $this->secondsToInterval($field('seconds_late')),
            'workflow_state' => $field('workflow_state'),
            'attempt' => $field('attempt')
        ];
    }

    private function secondsToInterval($seconds) {
        if ($seconds === null || $seconds === '' || !is_numeric($seconds))
            return null;

        return ((float)$seconds) . ' seconds';
    }

    private function toNumeric($value) {
        if ($value === null || trim((string)$value) === '' || !is_numeric($value))
            return null;

        return (string)$value;
    }

    private function isZeroInterval($lateness) {
        return preg_match('/^-?0+:0+:0+(\.0+)?$/', trim((string)$lateness)) === 1;
    }

    private function blankToNull($value) {
        if ($value === null || trim((string)$value) === '')
            return null;

        return $value;
    }

    private function resolveAsciUserId($asci_course_id, $computing_id, $email) {
        $candidates = [];
        if ($computing_id !== null && trim((string)$computing_id) !== '')
            $candidates[] = trim((string)$computing_id);
        if ($email !== null && strpos((string)$email, '@') !== false)
            $candidates[] = trim(substr((string)$email, 0, strpos((string)$email, '@')));

        foreach ($candidates as $candidate) {
            $row = $this->db->fetchRow($this->db->query(
                'SELECT u.id
                 FROM users u JOIN user_courses c ON c.user_id = u.id
                 WHERE LOWER(u.computing_id) = LOWER($1)
                   AND c.course_id = $2 AND c.role = \'student\'',
                [$candidate, $asci_course_id]
            ));

            if ($row)
                return $row['id'];
        }

        return null;
    }
}
