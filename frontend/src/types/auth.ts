export type AuthUser = {
  id: number
  username: string
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

export type ChangePasswordInput = {
  currentPassword: string
  newPassword: string
}

export type DeleteAccountInput = {
  currentPassword: string
}
