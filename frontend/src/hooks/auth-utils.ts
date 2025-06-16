import { AuthContext } from './auth-context';

// Function to format user name from first and last names
export const formatUserName = (firstName?: string, lastName?: string): string => {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  } else if (firstName) {
    return firstName;
  } else if (lastName) {
    return lastName;
  }
  return 'User';
};
