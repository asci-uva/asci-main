<?php

namespace asci\server\database;

use asci\data\Assignment as Assignment;
use asci\data\User as User;
use asci\Config as Config;

class DBSynchronization
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
        $this->logger = new \Monolog\Logger('DBSynchronization');
        $this->logger->pushHandler($log);
    }

    public function addCanvasLmsAccessToken($userId, $access_token) {
        $key = CONFIG::$TOKEN_ENCRYPTION_KEY;
        $iv = openssl_random_pseudo_bytes(16);
        $encrypted = openssl_encrypt($access_token, 'AES-256-CBC', $key, 0, $iv);
        $iv_base64 = base64_encode($iv);

        $this->db->prepare('upsertCanvasAccessTokenStmt',
            'INSERT INTO canvas_lms_access_tokens (user_id, access_token, access_token_iv) VALUES ($1, $2, $3)
             ON CONFLICT (user_id) DO UPDATE SET access_token = EXCLUDED.access_token, access_token_iv = EXCLUDED.access_token_iv');
        $this->db->execute('upsertCanvasAccessTokenStmt', [$userId, $encrypted, $iv_base64]);

        return true;
    }

    public function getPrimaryInstructorUserId($asci_course_id) {
        $row = $this->db->fetchrow($this->db->query(
            "SELECT user_id FROM user_courses WHERE course_id = $1 AND role = 'primary_instructor'",
            [$asci_course_id]
        ));

        return $row ? $row['user_id'] : null;
    }

    public function getCanvasLmsAccessTokenForCourse($asci_course_id) {
        $primary_instructor_id = $this->getPrimaryInstructorUserId($asci_course_id);
        if ($primary_instructor_id === null)
            return null;

        return $this->getCanvasLmsAccessToken($primary_instructor_id);
    }

    public function getCanvasLmsAccessToken($user_id) {
        $result = $this->db->fetchrow($this->db->query(
            'SELECT access_token, access_token_iv FROM canvas_lms_access_tokens WHERE user_id = $1',
            [$user_id]
        ));

        if (!$result)
            return null;

        $key = CONFIG::$TOKEN_ENCRYPTION_KEY;
        $iv = base64_decode($result["access_token_iv"]);
        $decrypted = openssl_decrypt($result["access_token"], 'AES-256-CBC', $key, 0, $iv);

        return $decrypted;
    }

    public function checkUserHasCanvasLmsAccessToken($user_id) {
        $this->db->prepare('canvasCheckAccessTokenStmt', 'SELECT EXISTS (SELECT 1 FROM canvas_lms_access_tokens WHERE user_id = $1)');
        $result = $this->db->fetchrow($this->db->execute('canvasCheckAccessTokenStmt', [$user_id]));

        return $result['exists'] === 't';
    }

    public function removeCanvasLmsAccessToken($user_id) {
        $this->db->beginTransaction();

        $this->db->prepare('checkCanvasLmsAccessTokenStmt',
            'SELECT * FROM canvas_lms_access_tokens WHERE user_id = $1');
        $result = $this->db->fetchrow($this->db->execute('checkCanvasLmsAccessTokenStmt', [$user_id]));

        if ($result) {
            $this->db->prepare('deleteCanvasLmsAccessTokenStmt',
                'DELETE FROM canvas_lms_access_tokens WHERE user_id = $1');
            $this->db->execute('deleteCanvasLmsAccessTokenStmt', [$user_id]);
        }

        $this->db->commit();

        return $result;    
    }

    public function linkCanvasLmsCourse($asci_course_id, $canvas_lms_course) {
        $this->db->beginTransaction();

        $this->db->prepare('checkCanvasCourseSyncStmt', 'SELECT EXISTS (SELECT 1 FROM canvas_lms_courses WHERE asci_course_id = $1)');
        $result = $this->db->fetchrow($this->db->execute('checkCanvasCourseSyncStmt', [$asci_course_id]));

        if ($result['exists'] === 't') {
            $this->db->prepare('updateCanvasCourseStmt',
                'UPDATE canvas_lms_courses SET canvas_course_id = $1, name = $2, course_code = $3 WHERE asci_course_id = $4');
            $this->db->execute('updateCanvasCourseStmt', [$canvas_lms_course["id"], $canvas_lms_course["name"], $canvas_lms_course["course_code"], $asci_course_id]);
        } else {
            $this->db->prepare('addCanvasCourseStmt', 
                'INSERT INTO canvas_lms_courses (asci_course_id, canvas_course_id, name, course_code) VALUES ($1, $2, $3, $4)');
            $this->db->execute('addCanvasCourseStmt', [$asci_course_id, $canvas_lms_course["id"], $canvas_lms_course["name"], $canvas_lms_course["course_code"]]);
        }

        $this->db->commit();

        return $this->getCanvasLmsCourse($asci_course_id);
    }

    public function getCanvasLmsCourse($asci_course_id) {
        $row = $this->db->fetchrow($this->db->query(
            'SELECT canvas_course_id, name, course_code, last_synced_at, stale_period, autosync_enabled FROM canvas_lms_courses WHERE asci_course_id = $1',
            [$asci_course_id]
        ));
        if ($row)
            $row['autosync_enabled'] = $row['autosync_enabled'] === 't';
        return $row;
    }

    public function getCanvasLmsSyncSettings($asci_course_id) {
        $row = $this->db->fetchrow($this->db->query(
            'SELECT autosync_enabled, stale_period, last_synced_at,
                    (last_synced_at IS NULL OR now() - last_synced_at > stale_period) AS is_stale
             FROM canvas_lms_courses WHERE asci_course_id = $1',
            [$asci_course_id]
        ));
        if ($row) {
            $row['autosync_enabled'] = $row['autosync_enabled'] === 't';
            $row['is_stale'] = $row['is_stale'] === 't';
        }
        return $row;
    }

    public function setCanvasLmsSyncSettings($asci_course_id, $autosync_enabled, $stale_period) {
        $this->db->prepare('setCanvasSyncSettingsStmt',
            'UPDATE canvas_lms_courses SET autosync_enabled = $1, stale_period = $2 WHERE asci_course_id = $3');
        $this->db->execute('setCanvasSyncSettingsStmt',
            [$autosync_enabled ? 't' : 'f', $stale_period, $asci_course_id]);

        return $this->getCanvasLmsSyncSettings($asci_course_id);
    }

    public function getLinkedCanvasLmsCourses() {
        return $this->db->fetchall($this->db->query(
            'SELECT cl.canvas_course_id, c.mnemonic, c.number, c.name, c.semester
             FROM canvas_lms_courses cl
             JOIN courses c ON c.id = cl.asci_course_id',
            []
        ));
    }

    public function unlinkCanvasLmsCourse($asci_course_id) {
        $this->db->beginTransaction();

        $result = $this->getCanvasLmsCourse($asci_course_id);

        if ($result) {
            $this->db->prepare('removeCanvasSubmissionsStmt',
                'DELETE FROM canvas_lms_submissions s
                  USING canvas_lms_assignments a
                  WHERE a.id = s.canvas_lms_assignment_id AND a.asci_course_id = $1');
            $this->db->execute('removeCanvasSubmissionsStmt', [$asci_course_id]);

            $this->db->prepare('removeCanvasAssignmentsStmt',
                'DELETE FROM canvas_lms_assignments WHERE asci_course_id = $1');
            $this->db->execute('removeCanvasAssignmentsStmt', [$asci_course_id]);

            $this->db->prepare('removeCanvasCourseStmt',
                'DELETE FROM canvas_lms_courses WHERE asci_course_id = $1');
            $this->db->execute('removeCanvasCourseStmt', [$asci_course_id]);
        }

        $this->db->commit();

        return $result;
    }

    public function acquireRosterSyncLock($asci_course_id) {
        $this->db->query("SELECT pg_advisory_lock(hashtext('canvas_roster_sync'), $1)", [$asci_course_id]);
    }

    public function releaseRosterSyncLock($asci_course_id) {
        $this->db->query("SELECT pg_advisory_unlock(hashtext('canvas_roster_sync'), $1)", [$asci_course_id]);
    }

    public function canvasLmsUserToAsciUser($canvasLmsUser) {
        $computing_id = isset($canvasLmsUser['login_id']) ? strtolower(trim((string)$canvasLmsUser['login_id'])) : '';
        if ($computing_id === '')
            return null;

        $role = null;
        $rank = ['student' => 1, 'ta' => 2, 'instructor' => 3, 'primary_instructor' => 4];
        $typeMap = [
            'StudentEnrollment' => 'student',
            'TaEnrollment' => 'ta',
            'TeacherEnrollment' => 'instructor',
        ];
        $enrollments = isset($canvasLmsUser['enrollments']) && is_array($canvasLmsUser['enrollments']) ? $canvasLmsUser['enrollments'] : [];
        foreach ($enrollments as $enrollment) {
            $state = isset($enrollment['enrollment_state']) ? $enrollment['enrollment_state'] : 'active';
            if ($state !== 'active' && $state !== 'invited')
                continue;
            $type = isset($enrollment['type']) ? $enrollment['type'] : null;
            if (!isset($typeMap[$type]))
                continue;
            $candidate = $typeMap[$type];
            if ($role === null ||  $rank[$candidate] > $rank[$role])
                $role = $candidate;
        }
        if ($role === null)
            return null;

        $sortable = isset($canvasLmsUser['sortable_name']) ? trim($canvasLmsUser['sortable_name']) : '';
        $name = isset($canvasLmsUser['name']) ? trim($canvasLmsUser['name']) : '';
        if ($sortable !== '' && strpos($sortable, ',') !== false) {
            list($lname, $fname) = array_pad(explode(',', $sortable, 2), 2, '');
            $lname = trim($lname);
            $fname = trim($fname);
        } else if ($name !== '') {
            $parts = preg_split('/\s+/', $name);
            $fname = $parts[0];
            $lname = count($parts) > 1 ? implode(' ', array_slice($parts, 1)) : '';
        } else {
            return null;
        }

        return [
            'computing_id' => $computing_id,
            'role' => $role,
            'fname' => $fname,
            'lname' => $lname,
            'pname' => $fname,
        ];
    }

    public function syncCanvasLmsRoster($asci_course_id, $converted) {
        $added = [];
        $updated = [];
        $removed = [];
        $convertedSeen = [];

        $this->db->beginTransaction();

        foreach ($converted as $person) {
            $convertedSeen[$person['computing_id']] = true;
            $userRow = $this->db->fetchrow($this->db->query(
                'SELECT id FROM users WHERE LOWER(computing_id) = LOWER($1)', [$person['computing_id']]));
            if ($userRow) {
                $userId = $userRow['id'];
            } else {
                $password = password_hash($person['computing_id'], PASSWORD_DEFAULT);
                $insertRow = $this->db->fetchrow($this->db->query(
                    'INSERT INTO users (computing_id, fname, lname, pname, password) VALUES (LOWER($1), $2, $3, $4, $5) ON CONFLICT (LOWER(computing_id)) DO NOTHING RETURNING id',
                    [$person['computing_id'], $person['fname'], $person['lname'], $person['pname'], $password]
                ));
                if ($insertRow) {
                    $userId = $insertRow['id'];
                } else {
                    $userRow = $this->db->fetchrow($this->db->query(
                        'SELECT id FROM users WHERE LOWER(computing_id) = LOWER($1)', [$person['computing_id']]));
                    $userId = $userRow['id'];
                }
            }

            $enrollment = $this->db->fetchrow($this->db->query(
                'SELECT role FROM user_courses WHERE user_id = $1 AND course_id = $2',
                [$userId, $asci_course_id]
            ));
            if (!$enrollment) {
                $insertResult = $this->db->query(
                    'INSERT INTO user_courses (user_id, course_id, role) VALUES ($1, $2, $3) ON CONFLICT (user_id, course_id) DO NOTHING',
                    [$userId, $asci_course_id, $person['role']]
                );
                if ($this->db->affectedRows($insertResult) === 1)
                    $added[] = ["computingId" => $person['computing_id'], 'fname' => $person['fname'], 'lname' => $person['lname'], 'role' => $person['role']];
            } else if ($enrollment['role'] !== $person['role'] && $enrollment['role'] !== \asci\util\Roles::PRIMARY_INSTRUCTOR) {
                $this->db->query(
                    "UPDATE user_courses SET role = $1 WHERE user_id = $2 AND course_id = $3 AND role <> 'primary_instructor'",
                    [$person['role'], $userId, $asci_course_id]
                );
                $updated[] = ["computingId" => $person['computing_id'], 'fname' => $person['fname'], 'lname' => $person['lname'], 'role' => $person['role']];
            }
        }

        $current = $this->db->query(
            "SELECT uc.user_id, uc.role, u.computing_id, u.fname, u.lname FROM user_courses uc JOIN users u ON u.id = uc.user_id WHERE uc.course_id = $1 AND uc.role in ('student', 'ta', 'instructor')",
            [$asci_course_id]
        );

        $usersToRemove = [];
        while ($row = $this->db->fetchrow($current)) {
            if (!isset($convertedSeen[$row['computing_id']]))
                $usersToRemove[] = $row;
        }

        foreach ($usersToRemove as $user) {
            $this->db->query(
                'DELETE FROM user_courses WHERE user_id = $1 AND course_id = $2',
                [$user['user_id'], $asci_course_id]
            );
            $removed[] = ["computingId" => $user['computing_id'], 'fname' => $user['fname'], 'lname' => $user['lname'], 'role' => $user['role']];
        }

        $this->db->query(
            'UPDATE canvas_lms_courses SET last_synced_at = now() WHERE asci_course_id = $1',
            [$asci_course_id]
        );

        $this->db->commit();

        return [
            'added' => $added,
            'updated' => $updated,
            'removed' => $removed
        ];
    }
}
