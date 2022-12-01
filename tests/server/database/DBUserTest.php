<?php
/**
 * Database User Test File
 *
 *
 * License:
 *
 * @author Tom Laudeman
 * @license http://opensource.org/licenses/BSD-3-Clause BSD 3-Clause
 * @copyright 2015 the Rector and Visitors of the University of Virginia, and
 *            the Regents of the University of California
 */

namespace test\asci\server\database;

use PHPUnit\Framework\TestCase;

/**
 * Database User test suite
 *
 * @author Tom Laudeman, asci group
 *
 */
class DBUserTest extends TestCase
{
    /**
     * DBUser object for this class
     * @var $dbu \asci\server\database\DBUser object
     */
    private $dbu = null;

    /**
     * Database Utility object
     *
     * We need to be able to read a constellation, so we need a DBUtil object.
     *
     * @var asci\server\database\DBUtil object.
     */
    private $dbutil;

    public function __construct()
    {
        parent::__construct(); // Must call the parent constructor
        $this->dbu = new \snac\server\database\DBUser();
        $this->dbutil = new \snac\server\database\DBUtil();

        // Prototypeing..
        // $this->traverseHead();
        // exit();
    }

}
