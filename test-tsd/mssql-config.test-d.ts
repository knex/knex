import { expectAssignable, expectType } from 'tsd';

import { Knex } from '../types';

expectType<Knex.MsSqlAzureActiveDirectoryAccessTokenAuthenticationConfig>({
  type: 'azure-active-directory-access-token',
    token: 'test',
    server: 'test',
    database: 'test'
} as Knex.MsSqlAzureActiveDirectoryAccessTokenAuthenticationConfig);

expectType<Knex.MsSqlAzureActiveDirectoryMsiAppServiceAuthenticationConfig>({
  type: 'azure-active-directory-msi-app-service',
  database: '',
  server: '',
  clientId: '',
  msiEndpoint: '',
  msiSecret: ''
} as Knex.MsSqlAzureActiveDirectoryMsiAppServiceAuthenticationConfig);

expectType<Knex.MsSqlAzureActiveDirectoryMsiVmAuthenticationConfig>({
  type: 'azure-active-directory-msi-vm',
  database: '',
  server: '',
  clientId: '',
  msiEndpoint: 'test',
} as Knex.MsSqlAzureActiveDirectoryMsiVmAuthenticationConfig);

expectType<Knex.MsSqlAzureActiveDirectoryPasswordAuthenticationConfig>({
  type: 'azure-active-directory-password',
  database: '',
  server: '',
  domain: '',
  password: '',
  userName: '',
} as Knex.MsSqlAzureActiveDirectoryPasswordAuthenticationConfig)

expectType<Knex.MsSqlAzureActiveDirectoryServicePrincipalSecretConfig>({
  clientId: '',
  clientSecret: '',
  database: '',
  server: '',
  tenantId: '',
  type: 'azure-active-directory-service-principal-secret',
} as Knex.MsSqlAzureActiveDirectoryServicePrincipalSecretConfig);

expectType<Knex.MsSqlDefaultAuthenticationConfig>({
  type: 'default',
  database: '',
  server: '',
  userName: '',
  password: '',
} as Knex.MsSqlDefaultAuthenticationConfig)

// Assert that no type property works and assumes default
expectType<Knex.MsSqlConnectionConfig>({
  server: '',
  database: '',
  userName: '',
  password: ''
} as Knex.MsSqlConnectionConfig);

expectAssignable<Knex.MsSqlConnectionConfigBase>({
  server: '',
  database: '',
});
