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
    const appendChild = vi.spyOn(document.body, 'appendChild');
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    vi.spyOn(document, 'createElement').mockReturnValue({
      click,
      remove,
      style: {},
    });

    downloadBlob(new Blob(['report']), 'Summer / Festival 2026', 'pdf');

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(appendChild).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:report');
  });
});
