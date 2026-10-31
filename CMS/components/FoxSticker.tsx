import Image from "next/image";

type FoxMood = "hello" | "reading" | "idea" | "thumbs-up" | "celebrate" | "thinking" | "sleepy" | "love";

type FoxStickerProps = {
  mood: FoxMood;
  alt: string;
  className?: string;
  priority?: boolean;
};

const foxFiles: Record<FoxMood, { src: string; width: number; height: number }> = {
  hello: { src: "/mascots/fox-hello.png", width: 248, height: 323 },
  reading: { src: "/mascots/fox-reading.png", width: 233, height: 289 },
  idea: { src: "/mascots/fox-idea.png", width: 249, height: 358 },
  "thumbs-up": { src: "/mascots/fox-thumbs-up.png", width: 246, height: 310 },
  celebrate: { src: "/mascots/fox-celebrate.png", width: 241, height: 337 },
  thinking: { src: "/mascots/fox-thinking.png", width: 256, height: 326 },
  sleepy: { src: "/mascots/fox-sleepy.png", width: 233, height: 317 },
  love: { src: "/mascots/fox-love.png", width: 244, height: 322 },
};

export default function FoxSticker({ mood, alt, className, priority = false }: FoxStickerProps) {
  const image = foxFiles[mood];

  return (
    <Image
      className={className}
      src={image.src}
      width={image.width}
      height={image.height}
      alt={alt}
      priority={priority}
      sizes="(max-width: 700px) 25vw, 120px"
    />
  );
}
