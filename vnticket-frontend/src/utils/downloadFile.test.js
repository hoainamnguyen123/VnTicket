import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadBlob } from './downloadFile';

describe('downloadBlob', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates and revokes an object URL using a safe filename', () => {
    const createObjectURL = vi.fn(() => 'blob:report');
    const revokeObjectURL = vi.fn();
    const click = vi.fn();
    const remove = vi.fn();
    const appendChild = vi
      .spyOn(document.body, 'appendChild')
      .mockImplementation((node) => node);
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    const anchor = {
      click,
      remove,
      style: {},
    };
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);

    downloadBlob(new Blob(['report']), 'Summer / Festival 2026', 'pdf');

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(appendChild).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:report');
    expect(anchor.download).toBe('bookings-summer-festival-2026.pdf');
  });

  it('uses fallback names and custom extensions safely', () => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:report'),
      revokeObjectURL: vi.fn(),
    });
    const anchor = {
      click: vi.fn(),
      remove: vi.fn(),
      style: {},
    };
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);

    downloadBlob(new Blob(['report']), '', 'csv');

    expect(anchor.download).toBe('bookings-event-report.csv');
  });
});
