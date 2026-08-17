export interface SignInCredentials {
  readonly email: string;
  readonly password: string;
}

export interface SignUpInput {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly phone?: string;
}

export interface ResetPasswordInput {
  readonly email: string;
}

export interface UpdatePasswordInput {
  readonly currentPassword: string;
  readonly newPassword: string;
}
