import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AdminDashboardOverview from './AdminDashboardOverview';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key, fallback) => fallback,
  }),
}));

describe('AdminDashboardOverview', () => {
  const stats = {
    totalBookings: 120,
    totalTicketsBooked: 250,
    totalTicketsPaid: 200,
    totalRevenue: 50000000,
  };

  it('shows operational metrics and the pending approval queue', () => {
    render(
      <AdminDashboardOverview
        stats={stats}
        pendingCount={7}
        approvedCount={18}
        rejectedCount={2}
        onCreateEvent={() => {}}
        onOpenPending={() => {}}
      />,
    );

    expect(screen.getByText('7 sự kiện chờ duyệt')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('50.000.000 ₫')).toBeInTheDocument();
  });

  it('provides direct actions for creating an event and opening pending items', () => {
    const onCreateEvent = vi.fn();
    const onOpenPending = vi.fn();
    render(
      <AdminDashboardOverview
        stats={stats}
        pendingCount={7}
        approvedCount={18}
        rejectedCount={2}
        onCreateEvent={onCreateEvent}
        onOpenPending={onOpenPending}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /tạo sự kiện/i }));
    fireEvent.click(screen.getByRole('button', { name: /xử lý chờ duyệt/i }));

    expect(onCreateEvent).toHaveBeenCalledOnce();
    expect(onOpenPending).toHaveBeenCalledOnce();
  });
});
