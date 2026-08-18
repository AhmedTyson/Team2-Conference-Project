/**
 * enums.js — Canonical Enums, Status Mappings & Badge Renderers
 * Synchronized with Laravel 12 PHP 8.2 Backed Enums.
 * 
 * @module core/enums
 */
(function (global) {
  'use strict';

  var ItEnums = {
    TripStatus: {
      PENDING: 'pending',
      PLANNING: 'planning',
      BOOKED: 'booked',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled'
    },

    AgencyAssignmentStatus: {
      REQUESTED: 'requested',
      ADMIN_APPROVED: 'admin_approved',
      AGENCY_APPROVED: 'agency_approved',
      AGENCY_DECLINED: 'agency_declined',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled'
    },

    ReviewStatus: {
      PENDING: 'pending',
      APPROVED: 'approved',
      REJECTED: 'rejected'
    },

    FlagStatus: {
      PENDING: 'pending',
      APPROVED: 'approved',
      DECLINED: 'declined'
    },

    ContactMessageStatus: {
      UNREAD: 'unread',
      READ: 'read',
      RESOLVED: 'resolved'
    },

    OrderStatus: {
      PENDING: 'pending',
      PAID: 'paid',
      FULFILLED: 'fulfilled',
      FAILED: 'failed',
      CANCELLED: 'cancelled',
      REFUNDED: 'refunded',
      EXPIRED: 'expired'
    },

    PaymentStatus: {
      PENDING: 'pending',
      PROCESSING: 'processing',
      PAID: 'paid',
      FAILED: 'failed',
      CANCELLED: 'cancelled',
      REFUNDED: 'refunded'
    },

    SubscriptionStatus: {
      PENDING: 'pending',
      ACTIVE: 'active',
      PAST_DUE: 'past_due',
      CANCELLED: 'cancelled',
      EXPIRED: 'expired',
      PAUSED: 'paused'
    },

    FlightStatus: {
      PENDING: 'pending',
      CONFIRMED: 'confirmed',
      CANCELLED: 'cancelled'
    },

    BudgetLevel: {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      LUXURY: 'luxury'
    },

    /**
     * Map of status to human-readable label and UI style token.
     */
    STATUS_MAP: {
      // Trips
      'pending': { label: 'Pending', badgeClass: 'badge-warn' },
      'planning': { label: 'In Planning', badgeClass: 'badge-info' },
      'booked': { label: 'Booked', badgeClass: 'badge-ok' },
      'completed': { label: 'Completed', badgeClass: 'badge-ok' },
      'cancelled': { label: 'Cancelled', badgeClass: 'badge-danger' },

      // Agency Assignments
      'requested': { label: 'Requested', badgeClass: 'badge-warn' },
      'admin_approved': { label: 'Admin Approved', badgeClass: 'badge-info' },
      'agency_approved': { label: 'Assigned / Accepted', badgeClass: 'badge-ok' },
      'agency_declined': { label: 'Declined', badgeClass: 'badge-danger' },

      // Reviews & Flags
      'approved': { label: 'Approved', badgeClass: 'badge-ok' },
      'rejected': { label: 'Rejected', badgeClass: 'badge-danger' },
      'declined': { label: 'Declined', badgeClass: 'badge-danger' },

      // Contacts
      'unread': { label: 'Unread', badgeClass: 'badge-warn' },
      'read': { label: 'Read', badgeClass: 'badge-neutral' },
      'resolved': { label: 'Resolved', badgeClass: 'badge-ok' },

      // Orders & Payments
      'paid': { label: 'Paid', badgeClass: 'badge-ok' },
      'processing': { label: 'Processing', badgeClass: 'badge-info' },
      'fulfilled': { label: 'Fulfilled', badgeClass: 'badge-ok' },
      'failed': { label: 'Failed', badgeClass: 'badge-danger' },
      'refunded': { label: 'Refunded', badgeClass: 'badge-neutral' },
      'expired': { label: 'Expired', badgeClass: 'badge-neutral' },

      // Subscriptions
      'active': { label: 'Active', badgeClass: 'badge-ok' },
      'past_due': { label: 'Past Due', badgeClass: 'badge-warn' },
      'paused': { label: 'Paused', badgeClass: 'badge-neutral' },

      // Flights
      'confirmed': { label: 'Confirmed', badgeClass: 'badge-ok' }
    },

    /**
     * Format a raw status string into a human-readable title.
     * @param {string} status
     * @returns {string}
     */
    getLabel: function (status) {
      if (!status) return 'Unknown';
      var s = String(status).toLowerCase();
      if (this.STATUS_MAP[s]) return this.STATUS_MAP[s].label;
      return s.replace(/_/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); });
    },

    /**
     * Render an accessible HTML badge for a given status.
     * @param {string} status
     * @param {string} [customLabel]
     * @returns {string} HTML markup
     */
    renderBadge: function (status, customLabel) {
      if (!status) return '<span class="status-badge badge-neutral">—</span>';
      var s = String(status).toLowerCase();
      var config = this.STATUS_MAP[s] || { label: this.getLabel(s), badgeClass: 'badge-neutral' };
      var label = customLabel || config.label;
      return '<span class="status-badge ' + config.badgeClass + '">' + label + '</span>';
    }
  };

  // Expose globally
  global.ItEnums = ItEnums;
  if (global.Itinera) {
    global.Itinera.Enums = ItEnums;
  }
})(typeof window !== 'undefined' ? window : this);
