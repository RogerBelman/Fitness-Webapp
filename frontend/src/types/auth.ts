export type AuthUser = {
  id: number
  username: string
  createdAt: string
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
