<?php

/**
 * Upload Exception Class
 *
 *
 * License:
 *
 *
 * @author Robbie Hott
 * @license https://opensource.org/licenses/BSD-3-Clause BSD 3-Clause
 * @copyright 2015 the Rector and Visitors of the University of Virginia, and
 *            the Regents of the University of California
 */
namespace asci\exceptions;

/**
 * ASCIUploadException Class
 *
 * Exception for handling errors with ASCI back-end database connection.
 *
 * @author Robbie Hott
 *
 */
class ASCIUploadException extends ASCIException {

    /**
     * Type of the exception being thrown
     *
     * @var string
     */
    protected $type = "File Upload Error";
}

