export const STUDENT = "student";
export const TA = "ta";
export const INSTRUCTOR = "instructor";
export const PRIMARY_INSTRUCTOR = "primary_instructor";

const ROLE_LABELS = {
  [STUDENT]: "Student",
  [TA]: "TA",
  [INSTRUCTOR]: "Instructor",
  [PRIMARY_INSTRUCTOR]: "Primary Instructor",
};

export function isInstructorRole(role) {
  return role === INSTRUCTOR || role === PRIMARY_INSTRUCTOR;
}

export function isPrimaryInstructor(role) {
  return role === PRIMARY_INSTRUCTOR;
}

export function isStaffRole(role) {
  return role === TA || isInstructorRole(role);
}

export function formatRole(role) {
  return ROLE_LABELS[role] ?? role;
}