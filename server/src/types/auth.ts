export interface User {
  id: number;
  email: string;
  name: string;
  password: string;
}

export interface SafeUser {
  id: number;
  email: string;
  name: string;
}

export interface JwtPayload {
  id: number;
  email: string;
}

export interface AuthResult {
  user: SafeUser;
  token: string;
}
