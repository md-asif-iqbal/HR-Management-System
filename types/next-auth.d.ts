import { DefaultSession, DefaultUser } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      employeeId: string;
      avatar: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: string;
    employeeId: string;
    avatar: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    employeeId: string;
    avatar: string;
  }
}
