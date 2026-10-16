export type AuthUser = {
  id: number
  username: string
  email: string | null
  weightUnit: 'lb' | 'kg'
  createdAt: string
}

export type AccountPreferencesInput = {
  weightUnit: 'lb' | 'kg'
}

export type Credentials = {
  username: string
  password: string
}

export type RegistrationInput = Credentials & {
  email: string
}

export type ChangeEmailInput = {
  email: string
  currentPassword: string
}

export type ResetPasswordInput = {
  token: string
  newPassword: string
}

export type ChangePasswordInput = {
  currentPassword: string
  newPassword: string
}

export type DeleteAccountInput = {
  currentPassword: string
}
