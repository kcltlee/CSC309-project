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
		id: 1,
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
		id: 2, 
		utorid: 'john123',
		name: 'John Manager',
		password: 'Abc123$',
		email: 'john@mail.utoronto.ca',
		role: 'manager',
		verified: true,
		activated: true,
	},
	{
		id: 3,
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
		id: 4, 
		utorid: 'cashier1',
		name: 'Cash One',
		password: 'Cash!1Aq',
		email: 'cash1@mail.utoronto.ca',
		role: 'cashier',
		verified: true,
		activated: true,
	},
	{
		id: 5,
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
		id: 6,
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
		id: 7,
		utorid: 'student1',
		name: 'Student One',
		password: 'Stud!11a',
		email: 'student1@mail.utoronto.ca',
		role: 'regular',
		verified: false,
		activated: true,
	},
	{
		id: 8,
		utorid: 'reguser',
		name: 'Student Two',
		password: 'Stud!22b',
		email: 'student2@utoronto.ca',
		role: 'regular',
		verified: true,
		activated: true,
	},
	{
		id: 9,
		utorid: 'userabc1',
		name: 'User ABC',
		password: 'User!!11',
		email: 'user@mail.utoronto.ca',
		role: 'regular',
		verified: false,
		activated: true,
	},
	{
		id: 10,
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
      // for each transaction type, list of fields to display
    // const typeFields = {
    //     purchase: ["id", "utorid", "type", "remark", "createdBy", "amount", "spent", "promotionIds", "suspicious"],
    //     transfer: ["id", "utorid", "type", "remark", "createdBy", "sender", "recipient", "amount"],
    //     redemption: ["id", "utorid", "type", "remark", "createdBy", "amount", "promotionIds", "relatedId", "redeemed"],
    //     adjustment: ["id", "utorid", "amount", "type", "relatedId", "promotionIds", "suspicious", "remark", "createdBy"],
    //     event: ["id", "utorid", "recipient", "amount", "type", "eventId", "remark", "createdBy"]
    // };

  const transactions = [
	// 6 purchases
	{
		id: 1,
		utorid: 'superusr',
		type: 'purchase',
		remark: 'groceries',
		createdBy: 'john123',
		amount: 400,
		spent: 100,
	},

	{
		id: 2,
		utorid: 'tester1',
		type: 'purchase',
		remark: 'transit',
		createdBy: 'superusr',
		amount: 200,
		spent: 50,
	},

	{
		id: 11,
		utorid: 'suscash',
		type: 'purchase',
		remark: 'doing something suspicious',
		createdBy: 'suscash',
		amount: 1000,
		spent: 250,
	},

	{
		id: 12,
		utorid: 'userabc1',
		type: 'purchase',
		remark: 'gift',
		createdBy: 'suscash',
		amount: 120,
		spent: 30,
	},

	{
		id: 13,
		utorid: 'student1',
		type: 'purchase',
		remark: 'school supplies',
		createdBy: 'alice123',
		amount: 40,
		spent: 10,
	},

	{
		id: 14,
		utorid: 'reguser',
		type: 'purchase',
		remark: 'regular purchase',
		createdBy: 'cashier1',
		amount: 4,
		spent: 1,
	},

	// 6 transfers
	{
		id: 3,
		utorid: 'tester1',
		type: 'transfer',
		remark: 'poker night',
		createdBy: 'tester1',
		amount: -10,
		sender: 'tester1',
		recipient: 'superusr',
		relatedId: 1
	},

	{
		id: 4,
		utorid: 'superusr',
		type: 'transfer',
		remark: 'poker night',
		createdBy: 'tester1',
		amount: 10,
		sender: 'tester1',
		recipient: 'superusr',
		relatedId: 10
	},

	{
		id: 5,
		utorid: 'superusr',
		type: 'transfer',
		remark: 'happy birthday',
		createdBy: 'superusr',
		amount: -100,
		sender: 'superusr',
		recipient: 'tester1',
		relatedId: 10
	},

	{
		id: 6,
		utorid: 'tester1',
		type: 'transfer',
		remark: 'happy birthday',
		createdBy: 'superusr',
		amount: 100,
		sender: 'superusr',
		recipient: 'tester1',
		relatedId: 1
	},

	{
		id: 15,
		utorid: 'userabc1',
		type: 'transfer',
		remark: 'good job',
		createdBy: 'userabc1',
		amount: -15,
		sender: 'userabc1',
		recipient: 'student1',
		relatedId: 7

	},

	{
		id: 16,
		utorid: 'student1',
		type: 'transfer',
		remark: 'good job',
		createdBy: 'userabc1',
		amount: 15,
		sender: 'userabc1',
		recipient: 'student1',
		relatedId: 9
	
	},

	// 6 redemptions
	{
		id: 7,
		utorid: 'tester1',
		type: 'redemption',
		remark: 'bubble tea',
		createdBy: 'tester1',
		amount: -20,
	},

	{
		id: 8,
		utorid: 'superusr',
		type: 'redemption',
		processed: true,
		remark: 'a processed redemption',
		createdBy: 'superusr',
		relatedId: 1,
		amount: -15,
	},

	{
		id: 17,
		utorid: 'userabc1',
		type: 'redemption',
		remark: '',
		createdBy: 'suscash',
		relatedId: 6,
		amount: -5,
	},

	{
		id: 18,
		utorid: 'tester1',
		type: 'redemption',
		remark: 'chocolate',
		createdBy: 'tester1',
		amount: -10,
	},

	{
		id: 19,
		utorid: 'superusr',
		type: 'redemption',
		remark: '',
		createdBy: 'john123',
		relatedId: 1,
		amount: -60,
	},

	{
		id: 20,
		utorid: 'reguser',
		type: 'redemption',
		remark: 'ice cream',
		createdBy: 'cashier3',
		processed: true,
		relatedId: 6,
		amount: -2,
	},

	// 2 adjustments
	{
		id: 9,
		utorid: 'superusr',
		type: 'adjustment',
		remark: 'apply promotion 1',
		createdBy: 'superusr',
		relatedId: 1,
		amount: 50,
	},

	{
		id: 10,
		utorid: 'tester1',
		type: 'adjustment',
		remark: 'inflation',
		createdBy: 'superusr',
		relatedId: 7,
		amount: -50,
	},
	{
		id: 21,
		utorid: 'userabc1',
		type: 'adjustment',
		remark: 'approved',
		createdBy: 'john123',
		relatedId: 12,
		amount: 120,
	},

	{
		id: 22,
		utorid: 'userabc1',
		type: 'adjustment',
		remark: 'remove extra points',
		createdBy: 'alice123',
		relatedId: 21,
		amount: -20,
	},
	{
		id: 23,
		utorid: 'student1',
		type: 'adjustment',
		remark: 'reduced price',
		createdBy: 'alice123',
		relatedId: 13,
		amount: 50,
	},

	{
		id: 24,
		utorid: 'reguser',
		type: 'adjustment',
		remark: 'refund points',
		createdBy: 'superusr',
		relatedId: 20,
		amount: 2,
	}

  ]
  for (const t of transactions) {
	await prisma.transaction.upsert({
	  	where: { id: t.id },
	  	update: {
			utorid: t.utorid,
			type: t.type,
			remark: t.remark,
			createdBy: t.createdBy,
			amount: t.amount,
			spent: t.spent,
	  	},	
	  	create: t,
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
