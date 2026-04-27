export type FeedbackType = 'bug' | 'data_error' | 'suggestion' | 'other';
export type FeedbackSeverity = 'critical' | 'high' | 'medium' | 'low';
export type FeedbackStatus = 'received' | 'in_review' | 'resolved' | 'needs_info';

export interface FeedbackReportPayload {
  type: FeedbackType;
  module: string;
  description: string;
  severity: FeedbackSeverity;
  screenshotData?: string; // Base64
  pageUrl: string;
  userAgent: string;
}

export interface FeedbackReportResponse {
  id: string;
  reportId: string;
  type: FeedbackType;
  module: string;
  description: string;
  severity: FeedbackSeverity;
  screenshotData?: string;
  metadata: {
    pageUrl: string;
    userAgent: string;
    timestamp: string;
  };
  userId: string;
  companyId?: string;
  status: FeedbackStatus;
  adminNotes?: string;
  resolvedAt?: string;
  createdAt: string;
}
