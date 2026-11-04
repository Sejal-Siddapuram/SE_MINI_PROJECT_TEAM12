const Notification = require('../models/Notification');
const Listing = require('../models/Listing');
const User = require('../models/User');
const mailer = require('../utils/mailer');

/**
 * Notification Service (SAD 3.5, FR-06, UC-11).
 * The in-app notification is always stored. The email is a best effort: if sending fails
 * the failure is only logged, so the request that caused the notification still succeeds.
 */

/**
 * Tells a student their application changed status.
 * Other modules call this after they change the status, e.g. Sagar's FR-08:
 *   await notificationService.notifyStatusChange(application);
 * `application` needs studentId, listingId and status. This function never throws.
 */
async function notifyStatusChange(application) {
  try {
    const [listing, student] = await Promise.all([
      Listing.findById(application.listingId).select('title company'),
      User.findById(application.studentId).select('email'),
    ]);
    const title = listing ? `"${listing.title}"` : 'a listing';
    const company = listing && listing.company ? ` at ${listing.company}` : '';
    const message = `Your application for ${title}${company} is now ${application.status}.`;

    await Notification.create({ userId: application.studentId, message, type: 'StatusChange' });

    if (student && student.email) {
      try {
        await mailer.sendMail({
          to: student.email,
          subject: 'CampusReady: your application status changed',
          text: message,
        });
      } catch (err) {
        console.error('[notification] email could not be sent:', err.message);
      }
    }
  } catch (err) {
    console.error('[notification] could not create the notification:', err.message);
  }
}

/** GET /api/notifications: the logged-in user's own notifications, newest first */
async function listMyNotifications(userId) {
  const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
  return notifications.map((n) => ({
    id: n._id,
    message: n.message,
    type: n.type,
    read: n.read,
    createdAt: n.createdAt,
  }));
}

module.exports = { notifyStatusChange, listMyNotifications };
