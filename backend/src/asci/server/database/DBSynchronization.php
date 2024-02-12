<?php

namespace asci\server\database;

use asci\data\Assignment as Assignment;

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

    public function updateSubmissionByCourseID($course_id, $filePath){
        // $filePath = '/Users/zhaohanzhang/Desktop/research_docs/asci-main/gradescope/CS_3120_Fall_2023_grades.csv';

        // // Open the file for reading
        // ini_set('memory_limit', '512M'); // Increase PHP memory limit to 512MB

        // $handle = fopen($filePath, "r");

        // if ($handle !== FALSE) {
        //     // Optionally, skip the header line if your CSV file has one
        //     // $header = fgetcsv($handle);

        //     while (($line = fgetcsv($handle, 1000, ",")) !== FALSE) {
        //         // Process each line here
        //         // For example, $line is an array of columns for the current row

        //         // Your database insertion logic here
        //     }
        //     fclose($handle);
        // } else {
        //     echo "Cannot open file or file does not exist.";
        // }
        $filename = 'CS_3120_Fall_2023_grades.csv';
        $filePath = dirname(__FILE__) . DIRECTORY_SEPARATOR . "data" . DIRECTORY_SEPARATOR . "{$filename}";

        // $filePath = '/Users/zhaohanzhang/Desktop/research_docs/asci-main/gradescope/CS_3120_Fall_2023_grades.csv';
        if (file_exists($filePath)) {
            echo "File exists.\n";
        } else {
            echo "File does not exist.\n";
        }
        
        if (is_readable($filePath)) {
            echo "File is readable.\n";
        } else {
            echo "File is not readable. Check permissions.\n";
        }
        // Open the CSV file
        if (($handle = fopen($filePath, "r")) !== FALSE) {
            // Read the header row
            $header = fgetcsv($handle);

            // Iterate over each row in the CSV
            while (($row = fgetcsv($handle)) !== FALSE) {
                // Extract student information
                $studentInfo = [
                    'name' => $row[0],
                    'sid' => $row[1],
                    'email' => $row[2],
                ];

                // Example: Iterate over assignments (starting from column 4 in this case)
                for ($i = 4; $i < count($header); $i += 4) { 
                    $assignment = [
                        'name' => $header[$i], // Assignment name
                        'score' => $row[$i], // Score
                        'max_points' => $row[$i + 1], // Max points
                        'submission_time' => $row[$i + 2], // Submission time
                        'lateness' => $row[$i + 3] // Lateness
                    ];

                    // Here we would insert $studentInfo and $assignment into the database
                    echo "Inserting: " . json_encode($studentInfo) . " - " . json_encode($assignment) . "\n";
                }
            }
            fclose($handle);
        }
    }
  
}
