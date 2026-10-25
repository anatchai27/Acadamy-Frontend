import helloImage from '../../../Objective/Branding/Mascots/fox-stickers/fox-hello.png';
import readingImage from '../../../Objective/Branding/Mascots/fox-stickers/fox-reading.png';
import ideaImage from '../../../Objective/Branding/Mascots/fox-stickers/fox-idea.png';
import thumbsUpImage from '../../../Objective/Branding/Mascots/fox-stickers/fox-thumbs-up.png';
import celebrateImage from '../../../Objective/Branding/Mascots/fox-stickers/fox-celebrate.png';
import thinkingImage from '../../../Objective/Branding/Mascots/fox-stickers/fox-thinking.png';
import sleepyImage from '../../../Objective/Branding/Mascots/fox-stickers/fox-sleepy.png';
import loveImage from '../../../Objective/Branding/Mascots/fox-stickers/fox-love.png';

const stickers = {
  hello: { image: helloImage, label: 'ทักทาย' },
  reading: { image: readingImage, label: 'กำลังอ่านหนังสือ' },
  idea: { image: ideaImage, label: 'มีไอเดีย' },
  thumbsUp: { image: thumbsUpImage, label: 'เยี่ยมเลย' },
  celebrate: { image: celebrateImage, label: 'ฉลองความสำเร็จ' },
  thinking: { image: thinkingImage, label: 'กำลังคิด' },
  sleepy: { image: sleepyImage, label: 'พักผ่อน' },
  love: { image: loveImage, label: 'ส่งกำลังใจ' },
};

export const FoxSticker = ({ action = 'hello', message, compact = false, className = '' }) => {
  const sticker = stickers[action] || stickers.hello;

  return (
    <div class={`fox-sticker-pop inline-flex max-w-full items-center gap-2 ${className}`}>
      <img
        src={sticker.image}
        alt=""
        aria-hidden="true"
        class={`shrink-0 object-contain ${compact ? 'h-14 w-14' : 'h-[4.5rem] w-[4.5rem]'}`}
      />
      {message && (
        <span class="rounded-2xl border border-sky-200 bg-white px-3 py-2 text-sm font-bold leading-tight text-ink-900 shadow-sm">
          {message}
        </span>
      )}
    </div>
  );
};