export interface TestUser {
  name: string;
  lastName: string;
  email: string;
  password: string;
}

/**
 * Generates an isolated test user with unique credentials
 */
export function generateUser(prefix = 'e2e'): TestUser {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 10000);
  return {
    name: `User${randomSuffix}`,
    lastName: 'Tester',
    email: `${prefix}_${timestamp}_${randomSuffix}@example.com`,
    password: 'Password123!',
  };
}
