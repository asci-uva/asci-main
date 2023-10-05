<?php

/*
CLASS ExclusiveLock
Description
==================================================================
This is a pseudo implementation of mutex since php does not have
any thread synchronization objects
This class uses flock() as a base to provide locking functionality.
Lock will be released in following cases
1 - user calls unlock
2 - when this lock object gets deleted
3 - when request or script ends
==================================================================
Usage:

//get the lock
$lock = new ExclusiveLock( "mylock" );

//lock
if( $lock->lock( ) == FALSE )
    error("Locking failed");
//--
//Do your work here
//--

//unlock
$lock->unlock();
===================================================================
*/

namespace asci\util;


class ExclusiveLock
{
    protected $key   = null;  //user given value
    protected $file  = null;  //resource to lock
    protected $own   = FALSE; //have we locked resource
    protected $dir   = null;

    function __construct( $key ) 
    {
        
        $this->dir = "./tmp/lock/";
        $this->key = $this->dir . $key;

        $filename = $this->key . ".lockfile";
        //create a new resource or get exisitng with same key
        $this->file = fopen($filename, 'w+');
    }


    function __destruct() 
    {
        if( $this->own == TRUE )
            $this->unlock( );
    }


    function lock( ) 
    {
        if( !flock($this->file, LOCK_EX | LOCK_NB)) 
        { //failed
            $key = $this->key;
            //error_log("ExclusiveLock::acquire_lock FAILED to acquire lock [$key]");
            return FALSE;
        }
        ftruncate($this->file, 0); // truncate file
        //write something to just help debugging
        fwrite( $this->file, "Locked\n");
        fflush( $this->file );

        $this->own = TRUE;
        return TRUE; // success
    }


    function unlock( ) 
    {
        $key = $this->key;
        if( $this->own == TRUE ) 
        {
            
            ftruncate($this->file, 0); // truncate file
            //write something to just help debugging
            fwrite( $this->file, "Unlocked\n");
            fflush( $this->file );
            $this->own = FALSE;
            if( !flock($this->file, LOCK_UN) )
            { //failed
                //error_log("ExclusiveLock::lock FAILED to release lock [$key]");
                return FALSE;
            }
            fclose($this->file);
        }
        
        return TRUE; // success
    }
};