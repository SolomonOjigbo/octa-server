/**
 * Event types and payloads for B2B Connection lifecycle events
 */
export enum B2BConnectionEvent {
  CONNECTION_REQUESTED = 'b2b.connection.requested',
  CONNECTION_APPROVED = 'b2b.connection.approved',
  CONNECTION_REJECTED = 'b2b.connection.rejected',
  CONNECTION_REVOKED = 'b2b.connection.revoked',
  CONNECTION_UPDATED = 'b2b.connection.updated',
  CONNECTION_DELETED = 'b2b.connection.deleted',
  CONNECTION_STATUS_CHANGED = 'b2b.connection.status_changed'
}

export type B2BConnectionRequestedPayload = {
  connectionId: string;
  initiatingTenantId: string;
  targetTenantId: string;
  requestedBy: string;
  type: string;
  settings?: Record<string, unknown>;
};

export type B2BConnectionApprovedPayload = {
  connectionId: string;
  approvedBy: string;
  approvedByTenantId: string;
  initiatingTenantId: string;
  targetTenantId: string;
  notes?: string;
};

export type B2BConnectionRejectedPayload = {
  connectionId: string;
  rejectedBy: string;
  rejectedByTenantId: string;
  initiatingTenantId: string;
  targetTenantId: string;
  reason?: string;
};

export type B2BConnectionRevokedPayload = {
  connectionId: string;
  revokedBy: string;
  revokedByTenantId: string;
  initiatingTenantId: string;
  targetTenantId: string;
  reason?: string;
};

export type B2BConnectionUpdatedPayload = {
  connectionId: string;
  updatedBy: string;
  changes: Record<string, unknown>;
};

export type B2BConnectionDeletedPayload = {
  connectionId: string;
  deletedBy: string;
  deletedByTenantId: string;
};

export type B2BConnectionStatusChangedPayload = {
  connectionId: string;
  previousStatus: string;
  newStatus: string;
  changedBy: string;
  changedByTenantId: string;
  reason?: string;
};

export type B2BConnectionEventPayloads =
  | B2BConnectionRequestedPayload
  | B2BConnectionApprovedPayload
  | B2BConnectionRejectedPayload
  | B2BConnectionRevokedPayload
  | B2BConnectionUpdatedPayload
  | B2BConnectionDeletedPayload
  | B2BConnectionStatusChangedPayload;