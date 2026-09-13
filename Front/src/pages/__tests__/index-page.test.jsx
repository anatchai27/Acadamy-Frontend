import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { IndexPage } from '../index';

vi.mock('preact-router', () => ({ route: vi.fn() }));
vi.mock('../../components/ui', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
  Card: ({ children }) => <section>{children}</section>,
}));
vi.mock('react-icons/hi2', () => ({
  HiOutlineCheckCircle: () => <span />,
  HiOutlineShieldCheck: () => <span />,
  HiOutlineChatBubbleLeftRight: () => <span />,
}));

describe('Public home page', () => {
  it('offers the verified trial lead flow and sign-in route', async () => {
    const { route } = await import('preact-router');
    render(<IndexPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Book a Trial Class' }));
    expect(route).toHaveBeenCalledWith('/trial-class');

    fireEvent.click(screen.getAllByRole('button', { name: 'Sign In' })[1]);
    expect(route).toHaveBeenCalledWith('/login');
  });
});
