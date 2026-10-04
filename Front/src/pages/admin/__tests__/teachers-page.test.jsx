import { fireEvent, render, screen } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeachersPage } from '../teachers-page';
import { teacherService } from '../../../services';

vi.mock('../../../layouts/admin-layout', () => ({
  AdminLayout: ({ children }) => <div>{children}</div>,
}));

vi.mock('../../../components/ui', () => ({
  SolidInput: ({ label, error, ...props }) => (
    <label>
      {label}
      <input {...props} />
      {error && <span role="alert">{error}</span>}
    </label>
  ),
  Button: ({ children, loading, ...props }) => <button {...props}>{loading ? 'กำลังดำเนินการ...' : children}</button>,
  ImageUpload: () => <div />,
  showToast: vi.fn(),
  showConfirm: vi.fn(async () => true),
}));

vi.mock('../../../services', () => ({
  teacherService: { getTeachers: vi.fn(), createTeacher: vi.fn(), patchTeacher: vi.fn(), deleteTeacher: vi.fn() },
  uploadService: { uploadTeacherPhoto: vi.fn() },
}));

vi.mock('../../../hooks', () => ({ useAbortController: () => () => undefined }));
vi.mock('../../../hooks/useDesignTheme', () => ({ useDesignTheme: () => ({ designTheme: 'default' }) }));
vi.mock('react-icons/hi2', () => ({
  HiOutlinePlus: () => <span aria-hidden="true" />,
  HiOutlinePencil: () => <span aria-hidden="true" />,
  HiOutlineTrash: () => <span aria-hidden="true" />,
  HiOutlineChevronLeft: () => <span aria-hidden="true" />,
  HiOutlineUserGroup: () => <span aria-hidden="true" />,
  HiOutlinePhoto: () => <span aria-hidden="true" />,
  HiOutlineXMark: () => <span aria-hidden="true" />,
  HiOutlineEye: () => <span aria-hidden="true" />,
}));

describe('teachers page cards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    teacherService.getTeachers.mockResolvedValue({
      data: {
        data: [
          {
            id: 8,
            fullName: 'ครูพิมพ์ ใจดี',
            userEmail: 'pim@example.test',
            photoUrl: '/teachers/8/photo.jpg',
            specialization: 'คณิตศาสตร์',
            bio: 'ประสบการณ์สอนระดับประถมและมัธยม',
            hourlyRate: 0,
          },
        ],
      },
    });
  });

  it('shows teacher photo, specialization, bio and hourly rate on a responsive card', async () => {
    render(<TeachersPage path="/admin/teachers" />);

    expect(await screen.findByRole('heading', { name: 'ครูพิมพ์ ใจดี' })).toBeInTheDocument();
    expect(screen.getByAltText('ครูพิมพ์ ใจดี')).toHaveAttribute('src', '/teachers/8/photo.jpg');
    expect(screen.getByText('คณิตศาสตร์')).toBeInTheDocument();
    expect(screen.getByText('ประสบการณ์สอนระดับประถมและมัธยม')).toBeInTheDocument();
    expect(screen.getByText('฿0')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /ดูโปรไฟล์/ }));
    expect(await screen.findByRole('heading', { name: 'ครูพิมพ์ ใจดี' })).toBeInTheDocument();
    expect(screen.getByText('ข้อมูลส่วนตัว')).toBeInTheDocument();
  });
});
