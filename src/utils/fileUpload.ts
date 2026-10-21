import { Platform } from 'react-native';

/**
 * Converts any local file URI (blob:..., file:///...) to a self-contained base64 Data URL (data:<mime>;base64,...)
 * so it can be stored persistently in PostgreSQL and rendered on any device.
 */
export const fileUriToBase64DataUrl = async (
  uri: string,
  fallbackMime = 'image/jpeg'
): Promise<string> => {
  if (!uri) return '';
  if (uri.startsWith('data:')) return uri;

  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result || uri);
      };
      reader.onerror = () => {
        resolve(uri);
      };
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Failed to convert file URI to base64 Data URL:', err);
    return uri;
  }
};
