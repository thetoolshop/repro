import dotenv from 'dotenv'
import { createEnv } from './createEnv'

dotenv.config()

export const defaultEnv = createEnv(process.env)
