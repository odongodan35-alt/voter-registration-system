import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating demo users in the cloud...');

  const password = await bcrypt.hash('Admin@123', 10);
  const officerPass = await bcrypt.hash('Officer@123', 10);
  const viewerPass = await bcrypt.hash('Viewer@123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@demo.local' }, update: {},
    create: { fullName: 'Demo Administrator', email: 'admin@demo.local', phone: '0700000001', passwordHash: password, role: 'ADMINISTRATOR', status: 'ACTIVE' }
  });

  await prisma.user.upsert({
    where: { email: 'officer@demo.local' }, update: {},
    create: { fullName: 'Demo Officer', email: 'officer@demo.local', phone: '0700000002', passwordHash: officerPass, role: 'REGISTRATION_OFFICER', status: 'ACTIVE' }
  });

  await prisma.user.upsert({
    where: { email: 'viewer@demo.local' }, update: {},
    create: { fullName: 'Demo Viewer', email: 'viewer@demo.local', phone: '0700000003', passwordHash: viewerPass, role: 'VIEWER', status: 'ACTIVE' }
  });

  console.log('✅ Demo users created successfully!');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());