export type CreateUserRequest = {
  name: string;
  phone: string;
  email: string;
  fyersId: string;
  fyersAppId: string;
  fyersSecretId: string;
  fyersPin: string;
  fyersRedirectUrl: string;
  totpKey: string;
};
