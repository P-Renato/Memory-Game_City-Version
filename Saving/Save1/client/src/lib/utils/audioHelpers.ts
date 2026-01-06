import type { AudioCache } from '../audioCache';

export async function loadAudioCache(): Promise<AudioCache | null> {
  try {
    const audioModule = await import('../audioCache');
    console.log("✅ audioCache module loaded");
    return audioModule.audioCache;
  } catch (error) {
    console.error("❌ Failed to load audio cache:", error);
    return null;
  }
}