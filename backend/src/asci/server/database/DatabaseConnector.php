<?php
/**
 * Database Connector Class File
 *
 * Contains a thin-layer database connector
 *
 * License:
 *
 * @author Robbie Hott
 * @license https://opensource.org/licenses/BSD-3-Clause BSD 3-Clause
 * @copyright 2015 the Rector and Visitors of the University of Virginia, and
 *            the Regents of the University of California
 */

namespace asci\server\database;

use \asci\Config as Config;
use \asci\exceptions\ASCIDatabaseException;

/**
 * Database Connector Class
 *
 * This class provides a thin layer in front of the standard PHP Postgres library functions, so that
 * correct error handling may happen throughout the code.  The methods in this class throw the appropriate ASCI
 * Exception object when something goes wrong during database connection and use.
 *
 * @author Robbie Hott
 *
 */
class DatabaseConnector {

    /**
     * @var \resource Database handle for postgres connection
     */
    private $dbHandle = null;

    /**
     * Convert php boolean to Postgres
     *
     * pg_execute() doesn't know to convert boolean to 't' and 'f' as required by Postgres. We can do it
     * ourselves.  Interestingly, the return value is a single character string containing t or f. In SQL it
     * would be literally 't'.
     *
     * Treat string 'true' as true, and 'false' as false just in case.
     *
     * @throws \asci\exceptions\ASCIDatabaseException
     *
     * @param string $arg A php boolean of whatever type as long as it will test true or false.
     *
     * @return string Either 't or 'f', for use as boolean in Postgres SQL.
     */
    public static function boolToPg($arg)
    {
        if ($arg === true || $arg == 'true')
        {
            return 't';
        }
        else if ($arg === false || $arg == 'false')
        {
            return 'f';
        }
        /*
         * We can easily change the above code so we never get here, but if we do get here, this exception will be thrown.
         */
        // printf("\nDatabaseConnector.php boolToPg() Unable convert arg to bool: $arg\n");
        throw new \asci\exceptions\ASCIDatabaseException("DatabaseConnector.php boolToPg() Unable convert arg to bool: $arg");
    }

    /**
     * Convert Postgres boolean to php
     *
     * pg_execute() doesn't know to convert boolean to 't' and 'f' from Postgres to php true and false. We do
     * it ourselves.
     *
     * This is for Postgres boolean types which may only have values 't' or 'f'. Any other value is an error.
     *
     * @throws \asci\exceptions\ASCIDatabaseException

     * @param string $arg A php boolean of whatever type as long as it will test true or false.
     *
     * @return boolean Return php true or false.
     */
    public static function pgToBool($arg)
    {
        if ($arg == 't')
        {
            return true;
        }
        elseif ($arg == 'f')
        {
            return false;
        }
        // If we get down here, something is very wrong. Seems like this should be fatal.
        // printf("\nDatabaseConnector.php Error: arg: $arg cannot convert to true or false\n");
        throw new \asci\exceptions\ASCIDatabaseException("DatabaseConnector.php pgToBool() Error: arg: $arg cannot convert to true or false");
    }

    /**
     * Constructor
     *
     * Opens the connection to the database on construct
     *
     * @throws \asci\exceptions\ASCIDatabaseException
     */
    public function __construct() {

        // Read the configuration file
        $host = Config::$DATABASE["host"];
        $port = Config::$DATABASE["port"];
        $database = Config::$DATABASE["database"];
        $password = Config::$DATABASE["password"];
        $user = Config::$DATABASE["user"];

        try {
            // Try to connect to the database
            $this->dbHandle = \pg_connect("host=$host port=$port dbname=$database user=$user password=$password");

            // If the connection does not throw an exception, but the connector is false, then throw.
            if ($this->dbHandle === false) {
                throw new \Exception("Unable to connect to back-end database.");
            }
        } catch (\Exception $e) {
            // Replace any exceptions with the ASCI Database Exception and re-throw back out.
            throw new \asci\exceptions\ASCIDatabaseException($e->getMessage());
        }

    }

    /**
     * Prepare A Statement
     *
     * Calls php postgres pg_prepare method.  The statement should be named, and the query given.
     *
     * @param string $statementName Name for the statement (allows multiple prepares)
     * @param string $query Query to prepare (with $1, $2, .. placeholders)
     */
    public function prepare($statementName, $query) {
        try {
            $result = \pg_prepare($this->dbHandle, $statementName, $query);

            // Check for error
            if ($result === false) {
                $errorMessage = \pg_last_error($this->dbHandle);
                throw new \Exception("Database Prepare Error: " . $errorMessage);
            }
        } catch (\Exception $e) {
            // Replace any exceptions with the ASCI Database Exception and re-throw back out
            throw new \asci\exceptions\ASCIDatabaseException($e->getMessage());
        }
    }

    /**
     * Execute a prepared database statement
     *
     * Executes the statement prepared earlier as $statementName, with the given array of values used to fill the
     * placeholders in the prepared statement.  Any values passed in the array will be converted to strings.
     *
     * @param string $statementName Statement name to execute
     * @param mixed[] $values Parameters to fill the prepared statement (will be cast to string)
     * @throws \asci\exceptions\ASCIDatabaseException
     * @return \resource Postgres resource for the result
     */
    public function execute($statementName, $values) {
        try {
            $result = \pg_execute($this->dbHandle, $statementName, $values);

            // Check for error
            if ($result === false) {
                $errorMessage = \pg_last_error($this->dbHandle);
                throw new \Exception("Database Execute Error: " . $errorMessage);
            }

            $resultError = \pg_result_error($result);
            if ($resultError === false) {
                throw new \Exception("Database Execute Error: Could not return results -- malformed result");
            } else if (!empty($resultError)) {
                throw new \Exception("Database Execute Error: " . $resultError);
            }

            return $result;
        } catch (\Exception $e) {
            // Replace any exceptions with the ASCI Database Exception and re-throw back out
            throw new \asci\exceptions\ASCIDatabaseException($e->getMessage());
        }
    }

    /**
     * Prepare and Execute a database statement. From the php docs on prepare(): [The first argument] stmtname
     * may be "" to create an unnamed statement, in which case any pre-existing unnamed statement is
     * automatically replaced; otherwise it is an error if the statement name is already defined in the
     * current session.
     *
     * Handles both the prepare and execute stages.
     *
     * @param string $query Query to prepare (with $1, $2, .. placeholders)
     * @param mixed[] $values Parameters to fill the prepared statement (will be cast to string)
     * @throws \asci\exceptions\ASCIDatabaseException
     * @return \resource Postgres resource for the result
     */
    public function query($query, $values) {
        $this->prepare("", $query);
        return $this->execute("", $values);
    }


    /**
     * Need to add some docs and perhaps throw an exception if the query exists and can't be deallocated. If
     * the query doesn't exist we don't particularly care.
     *
     * @param string $query The name of the query to deallocate. Query names are lower case strings. Things
     * break with mixed case.
     *
     * @return void
     *
     *
     */

    public function deallocate($query) {
        if (! pg_query($this->dbHandle, "deallocate $query"))
        {
            printf("deaollcate failed: %s\n", pg_last_error($cnx));
        }
    }

    /**
     * Fetch the next row
     *
     * Fetches the next row from the given resource and returns it as an associative array.
     *
     * @param \resource $resource Postgres result resource (From $db->execute())
     * @return string[] Next row from the database as an associative array, or false if no rows to return
     * @throws \asci\exceptions\ASCIDatabaseException
     */
    public function fetchRow($resource) {
        try {
            $row = \pg_fetch_assoc($resource);
            return $row;
        } catch (\Exception $e) {
            // Replace any exceptions with the ASCI Database Exception and re-throw back out
            throw new \asci\exceptions\ASCIDatabaseException($e->getMessage());
        }
    }


    /**
     * Fetch all rows
     *
     * Fetches all rows from the given resource and returns it as an array of associative arrays.
     *
     * @param \resource $resource Postgres result resource (From $db->execute())
     * @return string[][] All rows from the database as an associative array, or false if no rows to return
     * @throws \asci\exceptions\ASCIDatabaseException
     */
    public function fetchAll($resource) {
        try {
            $rows = \pg_fetch_all($resource);
            return $rows;
        } catch (\Exception $e) {
            // Replace any exceptions with the ASCI Database Exception and re-throw back out
            throw new \asci\exceptions\ASCIDatabaseException($e->getMessage());
        }
    }

    /**
     * Get the DB Handle
     *
     * This method returns the handle to the database.   This should never be used except in scripting.
     *
     * @return \resource Database handle for postgres connection
     */
    public function getHandle() {
        return $this->dbHandle;
    }

}
