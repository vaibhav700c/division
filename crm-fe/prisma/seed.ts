import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data
  await prisma.attachment.deleteMany({});
  await prisma.meetingTranscript.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.timeLog.deleteMany({});
  await prisma.approvalRequest.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.team.deleteMany({});

  // Create teams
  const heroTeam = await prisma.team.create({
    data: {
      name: 'HERO',
      description: 'Development team focused on app development and innovation',
    },
  })

  const bossTeam = await prisma.team.create({
    data: {
      name: 'BOSS',
      description: 'Web development team specializing in full-stack solutions',
    },
  })

  // Create users for HERO team
  const harshith = await prisma.user.create({
    data: {
      email: 'harshith@company.com',
      name: 'Harshith',
      role: 'TEAM_LEADER',
      teamId: heroTeam.id,
    },
  })

  const surmai = await prisma.user.create({
    data: {
      email: 'surmai@company.com',
      name: 'Surmai',
      role: 'TEAM_MEMBER',
      teamId: heroTeam.id,
    },
  })

  const mano = await prisma.user.create({
    data: {
      email: 'mano@company.com',
      name: 'Mano',
      role: 'TEAM_MEMBER',
      teamId: heroTeam.id,
    },
  })

  const latisha = await prisma.user.create({
    data: {
      email: 'latisha@company.com',
      name: 'Latisha',
      role: 'TEAM_MEMBER',
      teamId: heroTeam.id,
    },
  })

  // Create users for BOSS team
  const shreya = await prisma.user.create({
    data: {
      email: 'shreya@company.com',
      name: 'Shreya',
      role: 'TEAM_LEADER',
      teamId: bossTeam.id,
    },
  })

  const noel = await prisma.user.create({
    data: {
      email: 'noel@company.com',
      name: 'Noel',
      role: 'TEAM_MEMBER',
      teamId: bossTeam.id,
    },
  })

  const rahul = await prisma.user.create({
    data: {
      email: 'rahul@company.com',
      name: 'Rahul',
      role: 'TEAM_MEMBER',
      teamId: bossTeam.id,
    },
  })

  const vaibhav = await prisma.user.create({
    data: {
      email: 'vaibhav@company.com',
      name: 'Vaibhav',
      role: 'TEAM_MEMBER',
      teamId: bossTeam.id,
    },
  })

  // Create sample tasks for HERO team
  const task1 = await prisma.task.create({
    data: {
      title: 'Develop Mobile App Authentication',
      description: 'Implement secure user authentication system for the mobile application',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      estimatedHours: 12.0,
      workloadScore: 8.5,
      assignedToId: mano.id,
      createdById: harshith.id,
      teamId: heroTeam.id,
    },
  })

  const task2 = await prisma.task.create({
    data: {
      title: 'Design User Interface Components',
      description: 'Create reusable UI components with proper design system implementation',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      estimatedHours: 16.0,
      workloadScore: 7.0,
      assignedToId: surmai.id,
      createdById: harshith.id,
      teamId: heroTeam.id,
    },
  })

  const task3 = await prisma.task.create({
    data: {
      title: 'AWS Infrastructure Setup',
      description: 'Configure AWS services for scalable backend infrastructure',
      status: 'PENDING_APPROVAL',
      priority: 'MEDIUM',
      estimatedHours: 10.0,
      workloadScore: 6.5,
      assignedToId: latisha.id,
      createdById: harshith.id,
      teamId: heroTeam.id,
    },
  })

  // Create sample tasks for BOSS team
  const task4 = await prisma.task.create({
    data: {
      title: 'Backend API Development',
      description: 'Build RESTful APIs for the web application with proper documentation',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      estimatedHours: 20.0,
      workloadScore: 9.0,
      assignedToId: noel.id,
      createdById: shreya.id,
      teamId: bossTeam.id,
    },
  })

  const task5 = await prisma.task.create({
    data: {
      title: 'SEO Optimization',
      description: 'Implement SEO best practices and optimize website performance',
      status: 'DRAFT',
      priority: 'MEDIUM',
      estimatedHours: 8.0,
      workloadScore: 5.0,
      assignedToId: rahul.id,
      createdById: shreya.id,
      teamId: bossTeam.id,
    },
  })

  const task6 = await prisma.task.create({
    data: {
      title: 'Frontend Dashboard Development',
      description: 'Create responsive dashboard with modern UI/UX patterns',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      estimatedHours: 15.0,
      workloadScore: 7.5,
      assignedToId: vaibhav.id,
      createdById: shreya.id,
      teamId: bossTeam.id,
    },
  })

  // Create approval requests
  const approval1 = await prisma.approvalRequest.create({
    data: {
      taskId: task3.id,
      requestedById: latisha.id,
      status: 'PENDING',
      reason: 'AWS infrastructure setup ready for review - need budget approval',
    },
  })

  // Create time logs
  await prisma.timeLog.create({
    data: {
      taskId: task1.id,
      userId: mano.id,
      hoursSpent: 4.0,
      description: 'Implemented JWT authentication and password hashing',
      startTime: new Date('2025-10-16T09:00:00Z'),
      endTime: new Date('2025-10-16T13:00:00Z'),
    },
  })

  await prisma.timeLog.create({
    data: {
      taskId: task4.id,
      userId: noel.id,
      hoursSpent: 6.0,
      description: 'Developed user management APIs and database schemas',
      startTime: new Date('2025-10-16T10:00:00Z'),
      endTime: new Date('2025-10-16T16:00:00Z'),
    },
  })

  // Create comments
  await prisma.comment.create({
    data: {
      taskId: task2.id,
      userId: harshith.id,
      content: 'Great work on the design system! The components look consistent and reusable.',
    },
  })

  await prisma.comment.create({
    data: {
      taskId: task6.id,
      userId: shreya.id,
      content: 'Dashboard is looking good! Make sure to add responsive breakpoints for mobile.',
    },
  })

  // Create meeting transcript
  await prisma.meetingTranscript.create({
    data: {
      title: 'Team HERO & BOSS Standup Meeting',
      content: 'Discussed project progress, upcoming deadlines, and resource allocation between teams. HERO team focusing on mobile app features, BOSS team prioritizing web platform development.',
      meetingDate: new Date('2025-10-17T09:00:00Z'),
      location: 'Virtual Meeting Room',
      duration: 45,
      createdById: harshith.id,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log(`Created:`)
  console.log(`- 2 teams (HERO & BOSS)`)
  console.log(`- 8 users`)
  console.log(`- 6 tasks`)
  console.log(`- 1 approval request`)
  console.log(`- 2 time logs`)
  console.log(`- 2 comments`)
  console.log(`- 1 meeting transcript`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })