import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import { LanguageSwitcher } from './language-switcher';

describe('LanguageSwitcher', () => {
  afterEach(async () => {
    await i18n.changeLanguage('th');
  });

  it('switches between Thai and English', async () => {
    await i18n.changeLanguage('th');
    render(<LanguageSwitcher />);

    fireEvent.click(screen.getByRole('button', { name: 'Switch language to English' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'เปลี่ยนภาษาเป็นภาษาไทย' })).toBeInTheDocument());
    expect(i18n.language).toBe('en');

    fireEvent.click(screen.getByRole('button', { name: 'เปลี่ยนภาษาเป็นภาษาไทย' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Switch language to English' })).toBeInTheDocument());
    expect(i18n.language).toBe('th');
  });
});
