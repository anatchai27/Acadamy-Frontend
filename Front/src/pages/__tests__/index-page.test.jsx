import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { IndexPage } from '../index';

describe('Public home page', () => {
  it('offers search, provider discovery and partner onboarding', () => {
    render(<IndexPage />);

    const search = screen.getByRole('textbox', { name: 'ค้นหาสถาบันและคอร์ส' });
    fireEvent.input(search, { target: { value: 'Coding' } });
    expect(search.value).toBe('Coding');
    expect(screen.getByRole('heading', { name: 'สถาบันแนะนำประจำเดือน' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /เปิดคอร์สกับเรา/ })).toHaveAttribute('href', '#for-institutes');
  });
});
