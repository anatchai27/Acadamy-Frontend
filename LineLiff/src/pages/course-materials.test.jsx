import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CourseMaterialsPage } from './course-materials';

const services = vi.hoisted(() => ({
  downloadChildCourseMaterial: vi.fn(),
  getChildCourseMaterials: vi.fn(),
}));

vi.mock('../services/parent-service', () => services);
vi.mock('../store/LiffContext', () => ({
  useLiffContext: () => ({ state: { activeChildId: 20 } }),
}));
vi.mock('../components/liff-layout', () => ({ LiffLayout: ({ children }) => <main>{children}</main> }));

beforeEach(() => {
  vi.clearAllMocks();
  services.getChildCourseMaterials.mockResolvedValue({ data: { data: [{ id: 5, courseName: 'คณิตศาสตร์', fileName: 'ใบงาน.pdf', sizeBytes: 1024 }] } });
  services.downloadChildCourseMaterial.mockResolvedValue({ data: { url: 'https://storage.test/signed-file' } });
});

afterEach(() => cleanup());

describe('parent course materials', () => {
  it('loads materials for the selected child', async () => {
    render(<CourseMaterialsPage childId="20" />);
    expect(await screen.findByText('ใบงาน.pdf')).toBeTruthy();
    expect(services.getChildCourseMaterials).toHaveBeenCalledWith(20);
  });

  it('requests a signed download for a material', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<CourseMaterialsPage childId="20" />);
    fireEvent.click(await screen.findByRole('button', { name: 'ดาวน์โหลด' }));
    await waitFor(() => expect(services.downloadChildCourseMaterial).toHaveBeenCalledWith(5));
    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });
});