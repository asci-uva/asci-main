<?php

namespace asci\util;

class Roles
{

    const STUDENT = "student";
    const TA = "ta";
    const INSTRUCTOR = "instructor";
    const PRIMARY_INSTRUCTOR = "primary_instructor";

    public static function isInstructorRole($role): bool
    {
        return $role == self::INSTRUCTOR || $role == self::PRIMARY_INSTRUCTOR;
    }

    public static function isStaffRole($role): bool
    {
        return $role == self::TA || self::isInstructorRole($role);
    }
}