import { expectAssignable, expectType } from 'tsd';

import { Knex } from '../types';

const azureActiveDirectoryConfig: Knex.MsSqlAzureActiveDirectoryAccessTokenAuthenticationConfig = {
  type: 'azure-active-directory-access-token',
    token: 'test',
    server: 'test',
    database: 'test'
}

const azureActiveDirectoryMsiConfig: Knex.MsSqlAzureActiveDirectoryMsiAppServiceAuthenticationConfig = {
  type: 'azure-active-directory-msi-app-service',
  database: '',
  server: '',
  clientId: '',
  msiEndpoint: '',
  msiSecret: ''
}

const azureActiveDirectoryMsiVmConfig: Knex.MsSqlAzureActiveDirectoryMsiVmAuthenticationConfig = {
  type: 'azure-active-directory-msi-vm',
  database: '',
  server: '',
  clientId: '',
  msiEndpoint: 'test',
}

const azureActiveDirectoryPasswordConfig: Knex.MsSqlAzureActiveDirectoryPasswordAuthenticationConfig = {
  type: 'azure-active-directory-password',
  database: '',
  server: '',
  domain: '',
  password: '',
  userName: '',
}

const azureActiveDirectoryPrincipalConfig: Knex.MsSqlAzureActiveDirectoryServicePrincipalSecretConfig = {
  clientId: '',
  clientSecret: '',
  database: '',
  server: '',
  tenantId: '',
  type: 'azure-active-directory-service-principal-secret',
}

const defaultConfig: Knex.MsSqlDefaultAuthenticationConfig = {
  type: 'default',
  database: '',
  server: '',
  userName: '',
  password: '',
}

// Assert that no type property works and assumes default
const connectionConfig: Knex.MsSqlConnectionConfig = {
  server: '',
  database: '',
  userName: '',
  password: ''
};

expectAssignable<Knex.MsSqlConnectionConfigBase>({
  server: '',
  database: '',
});
