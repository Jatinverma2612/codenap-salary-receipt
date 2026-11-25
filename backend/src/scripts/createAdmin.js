import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import bcrypt from 'bcryptjs';
import '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Interactive CLI utility to create or reset an Admin/HR user account for production or local recovery.
 */
async function run() {
  const rl = readline.createInterface({ input, output });

  try {
    const nameInput = process.env.ADMIN_NAME || (await rl.question('Full Name: '));
    const emailInput = process.env.ADMIN_EMAIL || (await rl.question('Work Email: '));
    const passwordInput =
      process.env.ADMIN_PASSWORD || (await rl.question('Password (min 8 chars): '));
    const roleInput = (process.env.ADMIN_ROLE || (await rl.question('Role [admin/hr] (default admin): ')) || 'admin')
      .trim()
      .toLowerCase();

    const name = nameInput.trim();
    const email = emailInput.trim().toLowerCase();
    const role = roleInput === 'hr' ? 'hr' : 'admin';

    if (name.length < 2) {
      throw new Error('Name must be at least 2 characters.');
    }
    if (!EMAIL_REGEX.test(email)) {
      throw new Error('Invalid email address.');
    }
    if (passwordInput.length < 8 || passwordInput.length > 128) {
      throw new Error('Password must be between 8 and 128 characters.');
    }

    await connectDB();
    const passwordHash = await bcrypt.hash(passwordInput, 12);

    const existing = await User.findOne({ email });
    if (existing) {
      existing.name = name;
      existing.passwordHash = passwordHash;
      existing.role = role;
      existing.isActive = true;
      await existing.save();
      console.log(`Updated existing user "${existing.name}" (${existing.email}) with role "${existing.role}".`);
    } else {
      const created = await User.create({
        name,
        email,
        passwordHash,
        role,
        isActive: true,
      });
      console.log(`Created new user "${created.name}" (${created.email}) with role "${created.role}".`);
    }
  } finally {
    rl.close();
    await disconnectDB();
  }
}

run().catch((err) => {
  console.error('Admin setup failed:', err.message);
  process.exit(1);
});
