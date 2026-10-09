import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import { Injectable } from '@nestjs/common';
import type { PasswordHasher } from '../../application/index.js';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

/** Stores hashes as `scrypt$<saltHex>$<hashHex>`. */
@Injectable()
export class ScryptPasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    const salt = randomBytes(SALT_BYTES);
    const key = await scryptAsync(plain, salt, KEY_LENGTH);
    return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
  }
}
