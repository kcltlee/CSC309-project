/*
 * If you need to initialize your database with some data, you may write a script
 * to do so here.
 */
// run with npx prisma db seed

'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = [
	// superuser
	{
		utorid: 'superusr', 
		name: 'Super User',
		password: 'Admin!23', 
		email: 'super@mail.utoronto.ca',
		role: 'superuser',
		verified: true,
		activated: true,
		points: 1000,
	},

	// managers (2)
	{
		utorid: 'john123',
		name: 'John Manager',
		password: 'Abc123$',
		email: 'john@mail.utoronto.ca',
		role: 'manager',
		verified: true,
		activated: true,
	},
	{
		utorid: 'alice123',
		name: 'Anna Manager',
		password: 'pa$$Wor1',
		email: 'anna@utoronto.ca',
		role: 'manager',
		verified: true,
		activated: true,
	},

	// cashiers (3)
	{
		utorid: 'cashier1',
		name: 'Cash One',
		password: 'Cash!1Aq',
		email: 'cash1@mail.utoronto.ca',
		role: 'cashier',
		verified: true,
		activated: true,
	},
	{
		utorid: 'suscash',
		name: 'Suspicious Cashier',
		password: 'Cash!2Bq',
		email: 'cash2@utoronto.ca',
		role: 'cashier',
		suspicious: true,
		verified: true,
		activated: true,
	},
	{
		utorid: 'cashier3',
		name: 'Cash Three',
		password: 'Cash!3Cq',
		email: 'cash3@mail.utoronto.ca',
		role: 'cashier',
		verified: true,
		activated: true,
	},

	// regular users (4)
	{
		utorid: 'student1',
		name: 'Student One',
		password: 'Stud!11a',
		email: 'student1@mail.utoronto.ca',
		role: 'regular',
		verified: false,
		activated: true,
	},
	{
		utorid: 'reguser',
		name: 'Student Two',
		password: 'Stud!22b',
		email: 'student2@utoronto.ca',
		role: 'regular',
		verified: true,
		activated: true,
	},
	{
		utorid: 'userabc1',
		name: 'User ABC',
		password: 'User!!11',
		email: 'user@mail.utoronto.ca',
		role: 'regular',
		verified: false,
		activated: true,
	},
	{
		utorid: 'tester1',
		name: 'Tester One',
		password: 'Test!!11',
		email: 'tester@mail.utoronto.ca',
		role: 'regular',
		verified: true,
		activated: true,
	},
  ];

  for (const u of users) {
	await prisma.user.upsert({
	  	where: { utorid: u.utorid },
	  	update: {
			name: u.name,
			password: u.password,
			email: u.email,
			role: u.role,
			verified: u.verified,
			activated: u.activated,
			points: u.points ?? 0,
	  	},	
	  	create: u,
	});
  }
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
