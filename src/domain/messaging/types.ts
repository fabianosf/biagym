export interface CoachMessage {
  readonly id: string;
  readonly studentUserId: string;
  readonly senderId: string;
  readonly senderName: string;
  readonly body: string;
  readonly attachmentUrl?: string;
  readonly createdAt: string;
  readonly readAt?: string;
}

export interface SendCoachMessageInput {
  readonly studentUserId: string;
  readonly senderId: string;
  readonly body: string;
  readonly attachmentUrl?: string;
}
