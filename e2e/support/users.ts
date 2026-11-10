/**
 * Seed accounts used by the Sample App Web.
 *
 * The password is the same for every account in the demo application.
 * Authentication is a precondition of this suite, never the functionality
 * under test.
 */
export const PASSWORD = "secret_sauce";

export const USERS = {
  standard: "standard_user",
  problem: "problem_user",
  error: "error_user",
} as const;

export type UserKey = keyof typeof USERS;

export function credentialsFor(user: UserKey) {
  return { username: USERS[user], password: PASSWORD };
}
