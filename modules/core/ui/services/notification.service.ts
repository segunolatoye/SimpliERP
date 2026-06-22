import { prisma } from '@/lib/db';
import { redisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

export interface NotificationPayload {
  type: string;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
  sendEmail?: boolean;
}

export class NotificationService {
  /**
   * Sends a notification to a specific user within an organization.
   * Persists the notification to the DB, publishes to Redis for SSE push, and handles email queueing.
   */
  static async send(
    orgId: string,
    userId: string,
    payload: NotificationPayload
  ): Promise<void> {
    logger.info(`Sending notification to user ${userId} in org ${orgId}`, {
      type: payload.type,
      title: payload.title,
    });

    const notificationId = randomUUID();

    try {
      // 1. Persist to notifications table
      const notification = await prisma.notifications.create({
        data: {
          id: notificationId,
          org_id: orgId,
          user_id: userId,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          entity_type: payload.entityType || null,
          entity_id: payload.entityId || null,
          updated_at: new Date(),
        },
      });

      // 2. Publish to Redis for SSE (Server-Sent Events) live updates
      if (redisClient.isOpen) {
        const channel = `notifications:${orgId}:${userId}`;
        await redisClient.publish(channel, JSON.stringify(notification));
        logger.debug(`Published notification to Redis channel ${channel}`);
      } else {
        logger.warn('Redis is not connected. Skipped SSE live update push.');
      }

      // 3. Optionally queue email
      if (payload.sendEmail) {
        logger.info(`Queueing notification email to user ${userId}`);
        // In a real application, we would enqueue a BullMQ job:
        // await emailQueue.add('send-notification-email', { userId, title: payload.title, body: payload.body });
      }

    } catch (error) {
      logger.error('Failed to send notification', {
        error: error instanceof Error ? error.message : String(error),
        orgId,
        userId,
        payload,
      });
      throw error;
    }
  }
}

export const notify = NotificationService;
