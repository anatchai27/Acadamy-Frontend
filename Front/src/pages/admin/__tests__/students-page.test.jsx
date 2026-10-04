import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getStudentEmptyMessage, StudentsPage } from '../students-page';
import { studentService } from '../../../services';

vi.mock('../../../layouts/admin-layout', () => ({
  AdminLayout: ({ children }) => <div>{children}</div>,
}));

vi.mock('../../../components/ui', () => ({
  Button: ({ children, loading, ...props }) => <button {...props}>{loading ? 'กำลังดำเนินการ...' : children}</button>,
  SolidInput: ({ label, ...props }) => (
    <label>
      {label}
      <input {...props} />
    </label>
  ),
  showToast: vi.fn(),
}));

vi.mock('../../../services', () => ({
  studentService: { getStudents: vi.fn(), downloadStudentCsv: vi.fn() },
}));

vi.mock('../../../hooks', () => ({ useAbortController: () => () => undefined }));
vi.mock('../../../hooks/useDesignTheme', () => ({ useDesignTheme: () => ({ designTheme: 'default' }) }));
vi.mock('preact-router', () => ({ route: vi.fn() }));
vi.mock('react-icons/hi2', () => ({
  HiOutlinePlus: () => <span aria-hidden="true" />,
  HiOutlineEye: () => <span aria-hidden="true" />,
  HiOutlinePencil: () => <span aria-hidden="true" />,
  HiOutlineUserGroup: () => <span aria-hidden="true" />,
  HiOutlineTag: () => <span aria-hidden="true" />,
  HiOutlinePhone: () => <span aria-hidden="true" />,
  HiOutlineUser: () => <span aria-hidden="true" />,
  HiOutlineChevronLeft: () => <span aria-hidden="true" />,
  HiOutlineChevronRight: () => <span aria-hidden="true" />,
}));

describe('student list states', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    studentService.getStudents.mockResolvedValue({
      data: {
        data: {
          students: [
            {
              id: 42,
              fullName: 'มะลิ ใจดี',
              nickname: 'มะลิ',
              grade: 'ป.4',
              photoUrl: '/students/42/photo.jpg',
              primaryParentName: 'คุณแม่มะลิ',
              primaryParentPhone: '0812345678',
              authorizedPickups: [
                {
                  id: 9,
                  fullName: 'คุณตาสมพร',
                  phone: '0898765432',
                  relationship: 'ตา',
                },
              ],
            },
          ],
          pagination: { currentPage: 1, totalPages: 2, totalItems: 21, hasNext: true },
        },
      },
    });
  });

  it('gives a retry-oriented message when the API fails', () => {
    expect(getStudentEmptyMessage('โหลดไม่ได้', '')).toEqual({
      title: 'โหลดไม่ได้',
      description: 'ตรวจการเชื่อมต่อ API แล้วลองใหม่',
    });
  });

  it('distinguishes search empty state from an empty institute', () => {
    expect(getStudentEmptyMessage('', 'somchai').description).toBe('ลองเปลี่ยนคำค้นหา');
    expect(getStudentEmptyMessage('', '').description).toBe('ยังไม่มีนักเรียนในสถาบัน');
  });

  it('shows student photos and key details in cards with direct actions', async () => {
    render(<StudentsPage path="/admin/students" />);

    expect(await screen.findByRole('heading', { name: 'มะลิ ใจดี' })).toBeInTheDocument();
    expect(screen.getByAltText('รูปของ มะลิ ใจดี')).toHaveAttribute('src', '/students/42/photo.jpg');
    expect(screen.getByText('ป.4')).toBeInTheDocument();
    expect(screen.getByText('คุณแม่มะลิ')).toBeInTheDocument();
    expect(screen.getByText('คนที่มีสิทธิ์มารับ')).toBeInTheDocument();
    expect(screen.getByText('คุณตาสมพร')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '0898765432' })).toHaveAttribute('href', 'tel:0898765432');
    expect(screen.getByRole('link', { name: '0812345678' })).toHaveAttribute('href', 'tel:0812345678');

    fireEvent.click(screen.getByRole('button', { name: 'ดูโปรไฟล์' }));
    const { route } = await import('preact-router');
    expect(route).toHaveBeenCalledWith('/admin/students/42');
  });

  it('keeps server pagination when displaying cards', async () => {
    render(<StudentsPage path="/admin/students" />);
    await screen.findByRole('heading', { name: 'มะลิ ใจดี' });

    fireEvent.click(screen.getByRole('button', { name: 'หน้าถัดไป' }));

    await waitFor(() =>
      expect(studentService.getStudents).toHaveBeenLastCalledWith({ page: 2, limit: 20 }, { signal: undefined }),
    );
  });
});
