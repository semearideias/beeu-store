import bcrypt from 'bcryptjs';
import { getDatabase } from '../db/init.js';

async function createAdmin() {
  try {
    const db = await getDatabase();

    const email = 'admin@beeu.com';
    const password = 'admin123'; // MUDAR ISTO EM PRODUÇÃO!
    const name = 'Administrador';

    // Verificar se admin já existe
    const existing = await db.get('SELECT id FROM admin_users WHERE email = ?', [email]);
    if (existing) {
      console.log('✓ Admin já existe');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.run(
      'INSERT INTO admin_users (email, password, name, role, is_active) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, name, 'admin', 1]
    );

    console.log('✓ Admin criado com sucesso!');
    console.log(`Email: ${email}`);
    console.log(`Senha: ${password}`);
    console.log('\n⚠️  IMPORTANTE: Mude a senha após o primeiro login!');

    process.exit(0);
  } catch (error) {
    console.error('Erro ao criar admin:', error);
    process.exit(1);
  }
}

createAdmin();
