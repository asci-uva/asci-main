<?php

echo "Hello from the docker container<br><br>";
//phpinfo();

class Database {

    private $connection;

    private static $options = array(
        PDO::ATTR_EMULATE_PREPARES => FALSE, 
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    );

    public function get_connection(){
        return $this->connection;
    }

    public function __construct() {
        try {
            $dsn = 'pgsql:host=db;port=5432;dbname=asci';
            $username = 'postgres';
            $password = 'samplePassword';
            $connection = new PDO($dsn, $username, $password, self::$options);
            $this->connection = $connection;
            return $connection;      
        } catch (PDOException $e) {
            exit($e->getMessage());
        }
    }
}

echo "Creating DB Object...";
$database = new Database();
echo "Done<br><br>";

echo "Fetching User...<br><br>";
$stmt = $database->get_connection()->query("SELECT username FROM test_table WHERE username='mrf8t';");
$user = $stmt->fetch();
$userStr = $user['username'];

echo "User fetched from DB: $userStr was fetched <br><br>";




?>
