<?php

namespace asci\server\database;

use asci\data\Assignment as Assignment;
use asci\data\User as User;

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

    public function updateGradescopeAssignmentSubmissionByCourseId($course_id, $download_unique_id, $download_file_name) {
        $filename = $download_file_name;
        $filePath = \asci\Config::$GRADESCOPE_DOWNLOAD_PATH . DIRECTORY_SEPARATOR . $download_unique_id . DIRECTORY_SEPARATOR . "{$filename}";

        if (!file_exists($filePath) || !is_readable($filePath)) {
            $this->logger->addDebug("File could not be read", array("path" => $filePath));
            return NULL;
        }

        $handle = fopen($filePath, "r");
        if ($handle === FALSE) {
            $this->logger->addDebug("file could not be opened", array("path" => $filePath));
            return NULL;
        }

        $header = fgetcsv($handle);
        if (!$header) {
            $this->logger->addDebug("File has no header", array("path" => $filePath));
            fclose($handle);
            return NULL;
        }

        // Begin a transaction to batch operations
        $this->db->beginTransaction();

        // Prepare SQL statements outside of loops for efficiency
        $this->db->prepare('assignmentCheckStmt', 'SELECT id FROM assignments WHERE course_id = $1 AND name = $2');
        $this->db->prepare('updateAssignmentStmt', 'UPDATE assignments SET description = $1, max_score = $2, type = $3 WHERE id = $4');
        $this->db->prepare('insertAssignmentStmt', 'INSERT INTO assignments (course_id, name, description, max_score, type) VALUES ($1, $2, $3, $4, $5) RETURNING id');

        // Cache for assignment IDs to minimize DB queries
        $assignmentIds = [];

        /*Find column labeled "sections". Start at the column after that*/
        $startVal = 4; //default if error occurs / not found
        $sidCol = 0;
        for ($i = 0; $i < count($header) - 1; $i += 1) {
            if($header[$i] == "Sections"){
                $startVal = $i + 1;
            }
            if($header[$i] == "SID"){
                $sidCol = $i;
            }
        }

        // Process header to ensure all assignments are present in DB
        // and cache their IDs
        for ($i = $startVal; $i < count($header) - 1; $i += 4) {
            $assignmentName = $header[$i];
            $description = "Assignment description here";
            $type = "homework";
            $max_points = 0; // This will be updated later

            // Check if the assignment exists and get the ID
            $assignment = $this->db->fetchrow($this->db->execute('assignmentCheckStmt', [$course_id, $assignmentName]));

            if ($assignment) {
                $assignmentIds[$assignmentName] = $assignment['id'];
            } else {
                // Insert new assignment and get the ID
                $assignmentResult = $this->db->execute('insertAssignmentStmt', [$course_id, $assignmentName, $description, $max_points, $type]);
                $assignmentResultRow = $this->db->fetchrow($assignmentResult);
                $assignmentId = $assignmentResultRow['id'];
                $assignmentIds[$assignmentName] = $assignmentId;
            }
        }

        // handle the first row to extract the max_score of each assignments and update the assignments in the database
        $row = fgetcsv($handle);
        if($row){
            for ($i = $startVal; $i < count($header) - 1; $i += 4) {
                $assignmentName = $header[$i];
                $max_points = floatval($row[$i + 1]);
                $description = "Assignment description here";
                $type = "homework";
                $this->db->execute('updateAssignmentStmt', [$description, $max_points, $type, $assignmentIds[$assignmentName]]);
            }
        }
        else{
            $this->logger->addDebug("row was null for some reason", array("data" => null));
            return NULL;
        }

        // Prepare statements for user and submission checks outside of the loop for efficiency
        $this->db->prepare('userCheckStmt', 'SELECT id FROM users WHERE computing_id = $1');
        $this->db->prepare('insertSubmissionStmt', 'INSERT INTO submissions (assignment_id, user_id, score, max_score, lateness) VALUES ($1, $2, $3, $4, $5)');
        $this->db->prepare('updateSubmissionStmt', 'UPDATE submissions SET score = $1, max_score = $2, lateness = $3 WHERE id = $4');
        $this->db->prepare('submissionCheckStmt', 'SELECT id FROM submissions WHERE assignment_id = $1 AND user_id = $2');

        // Initialize an array to keep track of missing students whose data failed to be inserted into db
        $missingStudents = [];

        // Read each student row
        while ($row !== FALSE) {
            // Extract student information
            $studentInfo = [
                'sid' => $row[$sidCol],
                'email' => $row[$sidCol+1]
            ];

            // Check if the student exists
            $userResult = $this->db->execute('userCheckStmt', [$studentInfo['sid']]);
            $user = $this->db->fetchrow($userResult);

            if (!$user) {
                $missingStudents[] = $studentInfo['sid'];
                // Move to the next student
                $row = fgetcsv($handle);
                continue; // Skip this student if not found
            }

            $userId = $user['id'];

            // Iterate over assignments for the current student
            for ($i = $startVal; $i < count($header) - 1; $i += 4) {
                $assignmentName = $header[$i];
                $assignmentId = $assignmentIds[$assignmentName]; // Get cached assignment ID
                $score = floatval($row[$i]);
                $max_points = floatval($row[$i + 1]);
                $lateness = $row[$i + 3];

                // Check if the submission already exists
                $submissionResult = $this->db->execute('submissionCheckStmt', [$assignmentId, $userId]);
                $submission = $this->db->fetchrow($submissionResult);

                if ($submission) {
                    // Update existing submission
                    $this->db->execute('updateSubmissionStmt', [$score, $max_points, $lateness, $submission['id']]);
                } else {
                    // Insert new submission
                    $this->db->execute('insertSubmissionStmt', [$assignmentId, $userId, $score, $max_points, $lateness]);
                }
            }

            // Move to the next student
            $row = fgetcsv($handle);
        }

        fclose($handle);

        // Finalize the transaction
        $this->db->commit();

        return empty($missingStudents) ? ['no missing student'] : $missingStudents;
    }

    public function addCanvasLmsAccessToken($userId, $access_token) {
        $key = getenv("CANVAS_ENCRYPTION_KEY");
        $iv = openssl_random_pseudo_bytes(16);
        $encrypted = openssl_encrypt($access_token, 'AES-256-CBC', $key, 0, $iv);
        $iv_base64 = base64_encode($iv);

        $this->db->beginTransaction();

        $this->db->prepare('canvasCheckAccessTokenStmt', 'SELECT * FROM canvas_lms_access_tokens WHERE user_id = $1');
        $result = $this->db->fetchrow($this->db->execute('canvasCheckAccessTokenStmt', [$userId]));

        if ($result) {
            $this->db->prepare('updateCanvasAccessTokenStmt',
                'UPDATE canvas_lms_access_tokens SET access_token = $1, access_token_iv = $2 WHERE user_id = $3');
            $this->db->execute('updateCanvasAccessTokenStmt', [$encrypted, $iv_base64, $userId]);
        } else {
            $this->db->prepare('addCanvasAccessTokenStmt', 
                'INSERT INTO canvas_lms_access_tokens (user_id, access_token, access_token_iv) VALUES ($1, $2, $3)');
            $this->db->execute('addCanvasAccessTokenStmt', [$userId, $encrypted, $iv_base64]);
        }

        $this->db->commit();
        return true;
    }

    public function getCanvasLmsAccessToken($user_id) {
        $this->db->prepare('canvasGetAccessTokenStmt',
            'SELECT access_token, access_token_iv FROM canvas_lms_access_tokens WHERE user_id = $1');
        $result = $this->db->fetchrow($this->db->execute('canvasGetAccessTokenStmt', [$user_id]));

        if (!$result)
            return null;

        $key = getenv("CANVAS_ENCRYPTION_KEY");
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

    public function syncCanvasLmsCourse($asci_course_id, $canvas_lms_course) {
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
        return $this->db->fetchrow($this->db->query(
            'SELECT canvas_course_id, name, course_code FROM canvas_lms_courses WHERE asci_course_id = $1',
            [$asci_course_id]
        ));
    }

    public function getLinkedCanvasLmsCourses() {
        return $this->db->fetchall($this->db->query(
            'SELECT cl.canvas_course_id, c.mnemonic, c.number, c.name, c.semester
             FROM canvas_lms_courses cl
             JOIN courses c ON c.id = cl.asci_course_id',
            []
        ));
    }

    public function desyncCanvasLmsCourse($asci_course_id) {
        $result = $this->getCanvasLmsCourse($asci_course_id);

        if ($result) {
            $this->db->prepare('removeCanvasCourseStmt',
                'DELETE FROM canvas_lms_courses WHERE asci_course_id = $1');
            $this->db->execute('removeCanvasCourseStmt', [$asci_course_id]);
        }
        return $result;
    }

    public function canvasLmsUserToAsciUser($canvasLmsUser) {
        $computing_id = isset($canvasLmsUser['sis_user_id']) ? trim((string)$canvasLmsUser['sis_user_id']) : '';
        if ($computing_id === '')
            return null;

        $role = null;
        $rank = ['student' => 1, 'ta' => 2, 'instructor' => 3];
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
                'SELECT id FROM users WHERE computing_id = $1', [$person['computing_id']]));
            if ($userRow) {
                $userId = $userRow['id'];
            } else {
                $password = password_hash($person['computing_id'], PASSWORD_DEFAULT);
                $insertRow = $this->db->fetchrow($this->db->query(
                    'INSERT INTO users (computing_id, fname, lname, pname, password) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                    [$person['computing_id'], $person['fname'], $person['lname'], $person['pname'], $password]
                ));
                $userId = $insertRow['id'];
            }

            $enrollment = $this->db->fetchrow($this->db->query(
                'SELECT role FROM user_courses WHERE user_id = $1 AND course_id = $2', 
                [$userId, $asci_course_id]
            ));
            if (!$enrollment) {
                $this->db->query(
                    'INSERT INTO user_courses (user_id, course_id, role) VALUES ($1, $2, $3)',
                    [$userId, $asci_course_id, $person['role']]
                );
                $added[] = ["computingId" => $person['computing_id'], 'fname' => $person['fname'], 'lname' => $person['lname'], 'role' => $person['role']];
            } else if ($enrollment['role'] !== $person['role']) {
                $this->db->query(
                    'UPDATE user_courses SET role = $1 WHERE user_id = $2 AND course_id = $3',
                    [$person['role'], $userId, $asci_course_id]
                );
                $updated[] = ["computingId" => $person['computing_id'], 'fname' => $person['fname'], 'lname' => $person['lname'], 'role' => $person['role']];
            }
        }

        $current = $this->db->query(
            "SELECT uc.user_id, uc.role, u.computing_id, u.fname, u.lname FROM user_courses uc JOIN users u ON u.id = uc.user_id WHERE uc.course_id = $1 AND uc.role in ('student', 'ta')",
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

        $this->db->commit();

        return [
            'added' => $added,
            'updated' => $updated,
            'removed' => $removed
        ];
    }
}
