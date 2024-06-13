<?php

/**
 * LLM Exception Class
 *
 * License:
 *
 *
 * @author Robbie Hott
 * @license https://opensource.org/licenses/BSD-3-Clause BSD 3-Clause
 * @copyright 2015 the Rector and Visitors of the University of Virginia, and
 *            the Regents of the University of California
 */
namespace ascillm\exceptions;

/**
 * ASCIException Class
 *
 * Base class for exceptions thrown by the ASCI server. All exceptions should extend this class,
 * overwriting the $type variable to give more information about the type of exception
 * that is being thrown.
 *
 * @author Robbie Hott
 *
 */
class ASCILLMException extends ASCIException {

    /**
     * Type of the exception being thrown
     *
     * @var string
     */
    protected $type = "LLMConnection";
}

