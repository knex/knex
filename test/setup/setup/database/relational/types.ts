export interface DatabaseConfig {
  port: number,
  host: string,
  user: string,
  database: string,
  client: 'pg' | 'mysql' | 'postgres'
  password: string,
}
