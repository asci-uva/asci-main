export function errorMessage(error, fallback) {
  if (typeof error === "string" && error !== "") return error;
  if (error && typeof error.message === "string" && error.message !== "") return error.message;

  return fallback;
}
