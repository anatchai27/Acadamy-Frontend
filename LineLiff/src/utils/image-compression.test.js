import { describe, expect, it } from 'vitest';
import { compressImageFile } from './image-compression';

describe('homework image compression', () => {
  it('does not recreate an image that is already within the API upload target', async () => {
    const file = { size: 1024, name: 'answer.png', type: 'image/png' };
    await expect(compressImageFile(file)).resolves.toBe(file);
  });
});
