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

    public function updateGradescopeAssignmentSubmissionByCourseId($course_id, $download_file_name) {
        $filename = $download_file_name;
        $filePath = \asci\Config::$GRADESCOPE_DOWNLOAD_PATH . DIRECTORY_SEPARATOR . "{$filename}";

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

        // Process header to ensure all assignments are present in DB
        // and cache their IDs
        for ($i = 4; $i < count($header) - 1; $i += 4) {
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
            for ($i = 4; $i < count($header) - 1; $i += 4) {
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
                'sid' => $row[1],
                'email' => $row[2],
                'name' => $row[0],
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
            for ($i = 4; $i < count($header) - 1; $i += 4) {
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

}
