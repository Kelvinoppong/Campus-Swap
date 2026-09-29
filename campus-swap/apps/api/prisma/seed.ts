import { PrismaClient } from '@prisma/client';

/**
 * Seeds the schools table. `emailDomain` is what gates sign-up, so a school has
 * to exist here before anyone at it can request a code.
 */
const prisma = new PrismaClient();

const SCHOOLS = [
  {
    name: 'Example State University',
    emailDomain: 'example.edu',
    meetupSpots: [
      'Student Union lobby',
      'Main library entrance',
      'Campus police lobby',
      'Rec center entrance',
    ],
  },
];

async function main(): Promise<void> {
  for (const school of SCHOOLS) {
    const record = await prisma.school.upsert({
      where: { emailDomain: school.emailDomain },
      update: { name: school.name, meetupSpots: school.meetupSpots },
      create: school,
    });
    console.warn(`Seeded school ${record.name} (${record.emailDomain})`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
