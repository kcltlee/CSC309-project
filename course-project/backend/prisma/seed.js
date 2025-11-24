/*
 * If you need to initialize your database with some data, you may write a script
 * to do so here.
 */
// run with npx prisma db seed

'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const bcrypt = require('bcryptjs');

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
		avatarUrl: "https://img.freepik.com/free-photo/front-view-business-woman-suit_23-2148603018.jpg?semt=ais_hybrid&w=740&q=80"
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
		points: 200
	},
	{
		id: 3,
		utorid: 'alice123',
		name: 'Alice Manager',
		password: 'pa$$Wor1',
		email: 'alice@utoronto.ca',
		role: 'manager',
		verified: true,
		activated: true,
		points: 350,
		avatarUrl: "https://www.perfocal.com/blog/content/images/size/w960/2021/01/Perfocal_17-11-2019_TYWFAQ_100_standard-3.jpg"
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
		points: 10,
		avatarUrl: "https://p16-lemon8-sign-va.tiktokcdn.com/tos-maliva-v-ac5634-us/oYtAgBqWDfAIBASmvcJFEEqBEC3f7ApFwQDw1K~tplv-tej9nj120t-text-logo:QGJlc3RpZTE2Nw==:q75.jpeg?lk3s=c7f08e79&source=lemon8_seo&x-expires=1766642400&x-signature=ykgWLDNFLKsImnf%2FGK4e7BQ16hc%3D"
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
		avatarUrl: "https://t4.ftcdn.net/jpg/04/31/64/75/360_F_431647519_usrbQ8Z983hTYe8zgA7t1XVc5fEtqcpa.jpg"
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
		points: 2000
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
		points: 2590,
		avatarUrl: "https://images.ctfassets.net/h6goo9gw1hh6/2sNZtFAWOdP1lmQ33VwRN3/24e953b920a9cd0ff2e1d587742a2472/1-intro-photo-final.jpg?w=1200&h=992&fl=progressive&q=70&fm=jpg"
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
		points: 430,
		avatarUrl: "https://wallpapers.com/images/featured/black-and-white-profile-pictures-cn83bnwy0r4exqyl.jpg"
	},
	{
		id: 10,
		utorid: 'sustest',
		name: 'Suspicious Person',
		password: 'Test!!11',
		email: 'tester@mail.utoronto.ca',
		role: 'regular',
		verified: true,
		activated: true,
		suspicious: true,
		points: 1005,
		avatarUrl: "https://www.thesprucepets.com/thmb/A5Rkkt4HDWLAtUOk4gYybcX02mM=/1080x0/filters:no_upscale():strip_icc()/30078352_448703938920062_6275637137232625664_n-5b0de8c443a1030036f9e15e.jpg"
	},
	{
		id: 11,
		utorid: 'nopassw',
		name: 'Jane Smith',
		password: '',
		email: 'nopassword@mail.utoronto.ca',
		role: 'regular',
		verified: false,
		activated: false,
	},
	{
		id: 12,
		utorid: 'admin123',
		name: 'Sarah Jones',
		password: 'abc123',
		email: 'superuser@utoronto.ca',
		role: 'superuser',
		verified: false,
		activated: true,
		avatarUrl: "https://img.wattpad.com/e4b55799f59a849a320c56fd2273099072ded727/68747470733a2f2f73332e616d617a6f6e6177732e636f6d2f776174747061642d6d656469612d736572766963652f53746f7279496d6167652f4937656665514f516566634531673d3d2d313039383732303433362e313639306562333661653032636134623433333135363135383039312e706e67?s=fit&w=720&h=720"
	},
	{
		id: 13,
		utorid: 'email12',
		name: 'Email Tester',
		password: 'oldpassword',
		email: 'jaycee.law@mail.utoronto.ca',
		role: 'regular',
		verified: false,
		activated: true,
	}
  ];

  for (const u of users) {
	const hashedPassword = await bcrypt.hash(u.password, 10);

	await prisma.user.upsert({
		where: { utorid: u.utorid },
		update: {
			name: u.name,
			password: hashedPassword,
			email: u.email,
			role: u.role,
			verified: u.verified,
			activated: u.activated,
			points: u.points ?? 0,
		},
		create: {
			...u,
			password: hashedPassword, 
		},
	});
}

  // PROMOTIONS (all start times in the future; endTime after startTime)
  const h = (hrs) => new Date(Date.now() + hrs * 60 * 60 * 1000);

  const promotions = [
    {
      id: 1,
      name: 'Start of Summer Celebration',
      description: 'A simple promotion',
      type: 'automatic',
      startTime: h(2),
      endTime:   h(10),
      minSpending: 50,
      rate: 0.01,
      points: 0
    },
    {
      id: 2,
      name: 'Midweek Booster',
      description: 'Automatic light booster for midweek purchases',
      type: 'automatic',
      startTime: h(6),
      endTime:   h(30),
      minSpending: 20,
      rate: 0.5,
      points: 10
    },
    {
      id: 3,
      name: 'One-Time Welcome Drop',
      description: 'Single-use welcome bonus',
      type: 'onetime',
      startTime: h(1),
      endTime:   h(24),
      points: 100
    },
    {
      id: 4,
      name: 'Weekend Surge',
      description: 'Higher automatic rate for weekend spending',
      type: 'automatic',
      startTime: h(12),
      endTime:   h(60),
      minSpending: 10,
      rate: 2.0,
      points: 25
    },
    {
      id: 5,
      name: 'Exam Relief One-Time',
      description: 'One-time relief reward during exam period',
      type: 'onetime',
      startTime: h(4),
      endTime:   h(48),
      points: 75
    }
  ];

  for (const p of promotions) {
    await prisma.promotion.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        description: p.description,
        type: p.type,
        startTime: p.startTime,
        endTime: p.endTime,
        minSpending: p.minSpending,
        rate: p.rate,
        points: p.points
      },
      create: p
    });
  }

  // Events
  const events = [
	// Ended, full event 
	{
		id: 1,
		name: 'Study Group',
		description: 'Group studying for CSC309 midterm',
		location: 'Robarts Library',
		startTime: new Date('2024-12-20T09:00:00.000Z'),
		endTime: new Date('2024-12-20T21:00:00.000Z'),
		capacity: 3,
		pointsRemain: 0,
		pointsAwarded: 50,
		published: true,
		organizers: { connect: [{ id: 3 }] },
		guests: { connect: [] },  
		awards: { connect: [] },
	},
	// Ended, not full event
	{
		id: 2,
		name: 'Coding Workshop',
		description: 'Learn coding for beginners.',
		location: '40 St George St, Toronto, ON M5S 2E4',
		startTime: new Date('2025-09-10T08:00:00.000Z'),
		endTime: new Date('2025-10-10T17:00:00.000Z'),
		capacity: 20,
		pointsRemain: 0,
		pointsAwarded: 100,
		published: true,
		organizers: { connect: [{ id: 3 }] },
		guests: { connect: [] },
		awards: { connect: [] },
	},
	// Ended, not full 
	{
		id: 3,
		name: 'Cooking Workshop',
		description: 'Learn basic cooking.',
		location: '55 St George St, Toronto, ON M5S 0C9',
		startTime: new Date('2025-11-10T09:00:00.000Z'),
		endTime: new Date('2025-11-10T17:00:00.000Z'),
		capacity: 100,
		pointsRemain: 500,
		pointsAwarded: 0,
		published: true,
		organizers: { connect: [{ id: 3 }] },
		guests: { connect: [] },
		awards: { connect: [] },
	},

	// Ongoing, full event
	{
		id: 4,
		name: 'Art Workshop',
		description: 'Learn painting with friends.',
		location: 'Sidney Smith Hall',
		startTime: new Date('2025-10-01T18:00:00.000Z'),
		endTime: new Date('2025-12-01T20:00:00.000Z'),
		capacity: 3,
		pointsRemain: 0,
		pointsAwarded: 20,
		published: true,
		organizers: { connect: [{ id: 2 }] },
		guests: { connect: [] },  
		awards: { connect: [] },
	},
	// Ongoing, not full event 
	{
		id: 5,
		name: 'Music Workshop',
		description: 'Play instruments with friends. ',
		location: '80 Queens Pk Cres W, Toronto, ON M5S 2C5',
		startTime: new Date('2025-12-15T14:00:00.000Z'),
		endTime: new Date('2025-12-15T17:00:00.000Z'),
		capacity: 5,
		pointsRemain: 100,
		pointsAwarded: 30,
		published: true,
		organizers: { connect: [{ id: 2 }] },
		guests: { connect: [] }, 
		awards: { connect: [] },
	},
	{
        id: 6,
        name: 'Summer Event',
        description: 'Summer holiday gathering. ',
        location: '1681 Lake Shore Blvd E, Toronto, ON M4L 3W6',
        startTime: new Date('2025-06-05T12:00:00.000Z'),
        endTime: new Date('2025-06-05T18:00:00.000Z'),
        capacity: 150,
        pointsRemain: 0,
        pointsAwarded: 50,
        published: true,
        organizers: { connect: [{ id: 2 }] },
        guests: { connect: [] },
        awards: { connect: [] },
    },
    {
        id: 7,
        name: 'Summer Research',
        description: 'For students interested in research.',
        location: 'Toronto General Hospital',
        startTime: new Date('2025-06-25T15:00:00.000Z'),
        endTime: new Date('2025-06-25T17:00:00.000Z'),
        capacity: 50,
        pointsRemain: 0,
        pointsAwarded: 25,
        published: true,
        organizers: { connect: [{ id: 3 }] },
        guests: { connect: [] },
        awards: { connect: [] },
    }, 
    {
        id: 8,
        name: 'Hackathon',
        description: 'Join if you like to code.',
        location: 'Bahen Centre',
        startTime: new Date('2025-07-10T09:00:00.000Z'),
        endTime: new Date('2025-07-11T09:00:00.000Z'),
        capacity: 80,
        pointsRemain: 0,
        pointsAwarded: 150,
        published: true,
        organizers: { connect: [{ id: 2 }] },
        guests: { connect: [] },
        awards: { connect: [] },
    }, 
    {
        id: 10,
        name: 'AI Conference',
        description: 'Networking with industry professionals.',
        location: 'Convocation Hall',
        startTime: new Date('2025-10-20T11:00:00.000Z'),
        endTime: new Date('2025-10-20T15:00:00.000Z'),
        capacity: 500,
        pointsRemain: 0,
        pointsAwarded: 75,
        published: true,
        organizers: { connect: [{ id: 2 }] },
        guests: { connect: [] },
        awards: { connect: [] },
    }, 
    {
        id: 12,
        name: 'Exam Study Group',
        description: 'Lets study together.',
        location: 'Hart House',
        startTime: new Date('2025-12-28T19:00:00.000Z'),
        endTime: new Date('2025-12-28T23:00:00.000Z'),
        capacity: 300,
        pointsRemain: 500,
        pointsAwarded: 100,
        published: true,
        organizers: { connect: [{ id: 2 }] },
        guests: { connect: [] },
        awards: { connect: [] },
    }, 
    {
        id: 13,
        name: 'New Year Celebration',
        description: 'Lets celebrate the start of a new school year together.',
        location: 'Hart House',
        startTime: new Date('2026-01-15T10:00:00.000Z'),
        endTime: new Date('2026-01-15T14:00:00.000Z'),
        capacity: 400,
        pointsRemain: 1000,
        pointsAwarded: 50,
        published: true,
        organizers: { connect: [{ id: 3 }] },
        guests: { connect: [] },
        awards: { connect: [] },
    }
	];

	// add events
	for (const e of events) {
	  await prisma.event.upsert({
		where: { id: e.id },
		update: e,
		create: e,
	});
  }

  // Event Guests
  const eventGuests = [
	{ id: 1, userId: 10, eventId: 1, rsvp: true, confirmed: false }, // Study Group
	{ id: 2, userId: 8, eventId: 1, rsvp: true, confirmed: true },   // Study Group
	{ id: 3, userId: 9, eventId: 1, rsvp: true, confirmed: true },   // Study Group
	{ id: 4, userId: 7, eventId: 4, rsvp: true, confirmed: true },   // Art Workshop
	{ id: 5, userId: 8, eventId: 4, rsvp: true, confirmed: true },   // Art Workshop
	{ id: 6, userId: 9, eventId: 4, rsvp: true, confirmed: true },   // Art Workshop
	{ id: 7, userId: 10, eventId: 5, rsvp: true, confirmed: false }, // Music Workshop
  ];

// Add event guests
  for (const eg of eventGuests) {
	await prisma.eventGuest.upsert({
		where: { id: eg.id },
		update: {
		userId: eg.userId,
		eventId: eg.eventId,
		rsvp: eg.rsvp,
		confirmed: eg.confirmed,
		},
		create: eg,
	});
  }

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
