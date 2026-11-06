const request = require('supertest');
const app = require('../src/app');
const Notification = require('../src/models/Notification');
const Listing = require('../src/models/Listing');
const notificationService = require('../src/services/notificationService');
const mailer = require('../src/utils/mailer');
const {
  createStudent,
  createRecruiter,
  loginAs,
  auth,
} = require('./helpers/factories');

describe('Notifications (FR-06, UC-11)', () => {
  afterEach(() => {
    mailer.setTransport(null);
    jest.restoreAllMocks();
  });

  it('TC-NOT-01A: creates an in-app notification for an application status change', async () => {
    const { user: student } = await createStudent();
    const { user: recruiter } = await createRecruiter();

    const listing = await Listing.create({
      recruiterId: recruiter._id,
      company: 'Test Company',
      title: 'Backend Developer Intern',
      role: 'Backend Developer',
      type: 'Internship',
      location: 'Bengaluru',
      description: 'Test listing',
      deadline: new Date('2027-12-31'),
      status: 'Published',
      approvalStatus: 'Approved',
    });

    await notificationService.notifyStatusChange({
      studentId: student._id,
      listingId: listing._id,
      status: 'Shortlisted',
    });

    const notification = await Notification.findOne({ userId: student._id });

    expect(notification).not.toBeNull();
    expect(notification.message).toContain('Backend Developer Intern');
    expect(notification.message).toContain('Shortlisted');
    expect(notification.type).toBe('StatusChange');
    expect(notification.read).toBe(false);
  });

  it('TC-NOT-01B: returns only the authenticated student’s notifications', async () => {
    const { user: student1, password: password1 } = await createStudent();
    const { user: student2 } = await createStudent();

    await Notification.create([
      { userId: student1._id, message: 'Student one notification' },
      { userId: student2._id, message: 'Student two notification' },
    ]);

    const token = await loginAs(student1.email, password1);
    const res = await request(app)
      .get('/api/notifications')
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].message).toBe('Student one notification');
  });

  it('TC-NOT-01C: allows recruiters to retrieve their own notifications', async () => {
    const { user: recruiter, password } = await createRecruiter();

    await Notification.create({
      userId: recruiter._id,
      message: 'Recruiter notification',
    });

    const token = await loginAs(recruiter.email, password);
    const res = await request(app)
      .get('/api/notifications')
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].message).toBe('Recruiter notification');
  });

  it('TC-NOT-01D: returns notifications newest first and limits results to 50', async () => {
    const { user: student } = await createStudent();

    await Notification.insertMany(
      Array.from({ length: 55 }, (_, i) => ({
        userId: student._id,
        message: `Notification ${i + 1}`,
        createdAt: new Date(Date.now() + i * 1000),
      }))
    );

    const results = await notificationService.listMyNotifications(student._id);

    expect(results).toHaveLength(50);
    expect(results[0].message).toBe('Notification 55');
    expect(results[49].message).toBe('Notification 6');
  });

  it('TC-NOT-01E: preserves the in-app notification when email delivery fails', async () => {
    const { user: student } = await createStudent();
    const { user: recruiter } = await createRecruiter();

    const listing = await Listing.create({
      recruiterId: recruiter._id,
      company: 'Test Company',
      title: 'Test Internship',
      role: 'Developer',
      location: 'Bengaluru',
      description: 'Test listing',
      deadline: new Date('2027-12-31'),
      status: 'Published',
      approvalStatus: 'Approved',
    });

    mailer.setTransport({
      sendMail: async () => {
        throw new Error('Simulated email failure');
      },
    });

    jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      notificationService.notifyStatusChange({
        studentId: student._id,
        listingId: listing._id,
        status: 'Rejected',
      })
    ).resolves.toBeUndefined();

    expect(await Notification.countDocuments({ userId: student._id })).toBe(1);
  });
});
