import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ExportReportButtons from './ExportReportButtons';
import { exportEventBookings } from '../api/bookingExportApi';
import { downloadBlob } from '../utils/downloadFile';

vi.mock('../api/bookingExportApi', () => ({
  exportEventBookings: vi.fn(),
}));

vi.mock('../utils/downloadFile', () => ({
  downloadBlob: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key, fallback) => fallback,
  }),
}));

describe('ExportReportButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports PDF and downloads it with the event name', async () => {
    const blob = new Blob(['pdf']);
    exportEventBookings.mockResolvedValue(blob);
    render(
      <ExportReportButtons
        eventId={8}
        eventName="Đêm nhạc mùa hè"
        isAdmin={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /pdf/i }));

    await waitFor(() => {
      expect(exportEventBookings).toHaveBeenCalledWith({
        eventId: 8,
        format: 'pdf',
        isAdmin: false,
      });
    });
    expect(downloadBlob).toHaveBeenCalledWith(blob, 'Đêm nhạc mùa hè', 'pdf');
  });

  it('prevents a second export while the current format is downloading', async () => {
    let resolveExport;
    exportEventBookings.mockReturnValue(new Promise((resolve) => {
      resolveExport = resolve;
    }));
    render(
      <ExportReportButtons
        eventId={8}
        eventName="Report"
        isAdmin
      />,
    );

    const pdfButton = screen.getByRole('button', { name: /pdf/i });
    fireEvent.click(pdfButton);
    fireEvent.click(pdfButton);

    expect(exportEventBookings).toHaveBeenCalledTimes(1);
    resolveExport(new Blob(['pdf']));
    await waitFor(() => expect(downloadBlob).toHaveBeenCalledOnce());
  });

  it('shows a useful error when export fails', async () => {
    exportEventBookings.mockRejectedValue(new Error('network'));
    render(
      <ExportReportButtons
        eventId={8}
        eventName="Report"
        isAdmin={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /excel/i }));

    expect(await screen.findByText('Không thể xuất báo cáo. Vui lòng thử lại.')).toBeInTheDocument();
  });
});
