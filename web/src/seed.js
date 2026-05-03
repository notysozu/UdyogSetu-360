const bcrypt = require('bcryptjs');
const { connectDb, disconnectDb } = require('./config/db');
const User = require('./models/User');
const Department = require('./models/Department');
const Case = require('./models/Case');
const EventLog = require('./models/EventLog');
const Notification = require('./models/Notification');
const Grievance = require('./models/Grievance');
const Integration = require('./models/Integration');
const Certificate = require('./models/Certificate');
const ContactRequest = require('./models/ContactRequest');
const { createCase } = require('./services/caseService');

async function seed() {
  await connectDb();

  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    Case.deleteMany({}),
    EventLog.deleteMany({}),
    Notification.deleteMany({}),
    Grievance.deleteMany({}),
    Integration.deleteMany({}),
    Certificate.deleteMany({}),
    ContactRequest.deleteMany({})
  ]);

  const departments = await Department.insertMany([
    { code: 'KSPCB', name: 'Karnataka State Pollution Control Board', family: 'pollution', slaDays: 21 },
    { code: 'BESCOM', name: 'Bangalore Electricity Supply Company Limited', family: 'power', slaDays: 14 },
    { code: 'FIRE', name: 'Karnataka Fire and Emergency Services', family: 'fire', slaDays: 15 },
    { code: 'DISH', name: 'Factories, Boilers, Industrial Safety and Health', family: 'industrial_safety', slaDays: 30 },
    { code: 'LABOUR', name: 'Department of Labour', family: 'labour', slaDays: 10 }
  ]);

  const hash = await bcrypt.hash('password123', 10);
  const investor = await User.create({
    name: 'Asha Investor',
    email: 'investor@udyogsetu.local',
    passwordHash: hash,
    role: 'investor',
    organisation: 'Setu Foods Private Limited'
  });

  await User.insertMany([
    {
      name: 'Ravi Officer',
      email: 'officer@udyogsetu.local',
      passwordHash: hash,
      role: 'department_officer',
      department: departments[0]._id,
      organisation: departments[0].name
    },
    {
      name: 'Meera Admin',
      email: 'admin@udyogsetu.local',
      passwordHash: hash,
      role: 'admin',
      organisation: 'Karnataka Udyog Mitra'
    },
    {
      name: 'Anil Auditor',
      email: 'auditor@udyogsetu.local',
      passwordHash: hash,
      role: 'auditor',
      organisation: 'Audit Cell'
    }
  ]);

  await Integration.insertMany([
    { name: 'Python AI Service', kind: 'ai_service', config: { baseUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000' } },
    { name: 'n8n Operations', kind: 'n8n', config: { webhookSecretRequired: true } },
    { name: 'DigiLocker Sandbox Placeholder', kind: 'digilocker', status: 'disabled' }
  ]);

  const seededCase = await createCase({
    payload: {
      applicantName: 'Asha Investor',
      applicantEmail: 'investor@udyogsetu.local',
      applicantMobile: '9876543210',
      enterpriseName: 'Setu Foods Private Limited',
      industry: 'Food processing',
      district: 'Bengaluru Urban',
      investmentSize: '₹2 crore',
      landArea: '1.5 acres',
      fireSafety: 'yes',
      factoryLicence: 'yes',
      labourRegistration: 'yes'
    },
    user: investor,
    correlationId: 'seed-correlation-id'
  });

  await Certificate.create({
    certificateNumber: 'CERT-US360-DEMO-001',
    caseId: seededCase.caseId,
    verificationToken: 'VERIFY-US360-DEMO-001',
    departmentName: 'Karnataka Fire and Emergency Services',
    holderName: 'Asha Investor',
    enterpriseName: 'Setu Foods Private Limited',
    issuedAt: new Date(),
    status: 'valid'
  });

  console.log('Seed completed. Demo password for all users: password123');
  await disconnectDb();
}

seed().catch(async (error) => {
  console.error(error);
  await disconnectDb();
  process.exit(1);
});
