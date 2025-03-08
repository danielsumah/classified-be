import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

export const dataSourceOption: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: 5432,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: ['dist/**/*.entity.js'],
  synchronize: false,
  ssl: process.env.NODE_ENV == 'production' ? true : false,
  migrations: ['dist/database/migrations/*.js'],
  migrationsTableName: 'migrations',
};

const myDataSource = new DataSource(dataSourceOption);
export default myDataSource;
