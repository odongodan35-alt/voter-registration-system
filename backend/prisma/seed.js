import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const COUNTIES = [
  { name: 'Kakamega', code: '037', constituencies: [
    { name: 'Lurambi', code: '037-01', wards: [
      { name: 'Butsotso East', code: '037-01-01', stations: ['Eshisiru Primary', 'Mukhonje Market'] },
      { name: 'Butsotso South', code: '037-01-02', stations: ['Lubao Primary'] }
    ]},
    { name: 'Mumias East', code: '037-02', wards: [
      { name: 'East Wanga', code: '037-02-01', stations: ['Mumias Boys High'] }
    ]}
  ]},
  { name: 'Nairobi', code: '047', constituencies: [
    { name: 'Westlands', code: '047-01', wards: [
      { name: 'Parklands', code: '047-01-01', stations: ['Parklands Primary'] },
      { name: 'Kitisuru', code: '047-01-02', stations: ['Kitisuru Primary'] }
    ]},
    { name: 'Embakasi East', code: '047-02', wards: [
      { name: 'Upper Savannah', code: '047-02-01', stations: ['Savannah Primary'] }
    ]}
  ]},
  { name: 'Kisumu', code: '042', constituencies: [
    { name: 'Kisumu Central', code: '042-01', wards: [
      { name: 'Railways', code: '042-01-01', stations: ['Kisumu Union'] }
    ]}
  ]}
];

async function main() {
  console.log('Seeding DEMO data (all records are fictional)...');
  const password = await bcrypt.hash('Admin@123', 10);
  const officerPass = await bcrypt.hash('Officer@123', 10);
  const viewerPass = await bcrypt.hash('Viewer@123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@demo.local' }, update: {},
    create: { fullName: 'Demo Administrator', email: 'admin@demo.local', phone: '0700000001', passwordHash: password, role: 'ADMINISTRATOR', status: 'ACTIVE' }
  });
  const officer = await prisma.user.upsert({
    where: { email: 'officer@demo.local' }, update: {},
    create: { fullName: 'Demo Officer', email: 'officer@demo.local', phone: '0700000002', passwordHash: officerPass, role: 'REGISTRATION_OFFICER', status: 'ACTIVE' }
  });
  await prisma.user.upsert({
    where: { email: 'viewer@demo.local' }, update: {},
    create: { fullName: 'Demo Viewer', email: 'viewer@demo.local', phone: '0700000003', passwordHash: viewerPass, role: 'VIEWER', status: 'ACTIVE' }
  });

  for (const c of COUNTIES) {
    const county = await prisma.county.upsert({ where: { code: c.code }, update: {}, create: { name: c.name, code: c.code } });
    for (const con of c.constituencies) {
      const constituency = await prisma.constituency.upsert({
        where: { code: con.code }, update: {},
        create: { name: con.name, code: con.code, countyId: county.id }
      });
      for (const w of con.wards) {
        const ward = await prisma.ward.upsert({
          where: { code: w.code }, update: {},
          create: { name: w.name, code: w.code, constituencyId: constituency.id }
        });
        for (let i = 0; i < w.stations.length; i++) {
          const s = w.stations[i];
          await prisma.pollingStation.upsert({
            where: { code: `${w.code}-S${i + 1}` }, update: {},
            create: { name: s, code: `${w.code}-S${i + 1}`, location: `${s}, ${w.name}`, wardId: ward.id }
          });
        }
      }
    }
  }

  const kakamega = await prisma.county.findUnique({ where: { code: '037' } });
  const lurambi = await prisma.constituency.findFirst({ where: { code: '037-01' } });
  const ward = await prisma.ward.findFirst({ where: { code: '037-01-01' } });
  const station = await prisma.pollingStation.findFirst({ where: { wardId: ward.id } });

  const demoVoters = [
    { fullName: 'Daniel Demo Otieno', gender: 'MALE', dob: '1990-05-12' },
    { fullName: 'Grace Demo Wanjiku', gender: 'FEMALE', dob: '1988-11-03' },
    { fullName: 'Peter Demo Kamau', gender: 'MALE', dob: '1995-02-20' }
  ];

  for (let i = 0; i < demoVoters.length; i++) {
    const v = demoVoters[i];
    const ref = `VRS-2024-${String(i + 1).padStart(5, '0')}`;
    await prisma.voterRecord.upsert({
      where: { referenceNumber: ref }, update: {},
      create: {
        referenceNumber: ref, fullName: v.fullName, dateOfBirth: new Date(v.dob),
        nationality: 'Kenyan', gender: v.gender, phone: `07${String(10000000 + i).slice(0, 8)}`,
        countyId: kakamega.id, constituencyId: lurambi.id, wardId: ward.id,
        pollingStationId: station.id,
        registrationStatus: i === 0 ? 'VERIFIED' : 'PENDING',
        registeredById: officer.id
      }
    });
  }
  console.log('Seed complete.');
  console.log('Logins: admin@demo.local / Admin@123, officer@demo.local / Officer@123, viewer@demo.local / Viewer@123');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());