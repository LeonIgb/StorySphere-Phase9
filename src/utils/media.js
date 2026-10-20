// Picking media with Expo-compatible APIs (expo-image-picker), loaded defensively so the rest
// of the studio keeps working, with "paste a link" as the fallback, if the module is missing.

let ImagePicker = null;
try {
  // eslint-disable-next-line global-require
  ImagePicker = require('expo-image-picker');
} catch (e) {
  ImagePicker = null;
}

export const PICKER_SUPPORTED = Boolean(ImagePicker && typeof ImagePicker.launchImageLibraryAsync === 'function');

// Result shape for every pick: { status: 'picked' | 'cancelled' | 'unsupported' | 'error', items, message }
//   items: [{ uri, name }]

export function fileNameOf(uri) {
  const clean = String(uri || '').split('?')[0].split('#')[0];
  const last = clean.split('/').filter(Boolean).pop() || '';
  try {
    return decodeURIComponent(last) || 'media';
  } catch (e) {
    return last || 'media';
  }
}

async function launch(kind, options) {
  const base = { quality: 0.85, ...options };
  try {
    // Current API: mediaTypes is an array of 'images' | 'videos'.
    return await ImagePicker.launchImageLibraryAsync({ ...base, mediaTypes: [kind] });
  } catch (first) {
    // Older SDKs use the MediaTypeOptions enum.
    const legacy = ImagePicker.MediaTypeOptions;
    if (legacy) {
      return ImagePicker.launchImageLibraryAsync({
        ...base,
        mediaTypes: kind === 'videos' ? legacy.Videos : legacy.Images,
      });
    }
    throw first;
  }
}

async function pick(kind, options) {
  if (!PICKER_SUPPORTED) {
    return { status: 'unsupported', items: [], message: 'Picking from the library isn’t available here. Paste a link instead.' };
  }
  try {
    const result = await launch(kind, options);
    if (!result || result.canceled || result.cancelled) return { status: 'cancelled', items: [], message: '' };
    const assets = result.assets || (result.uri ? [result] : []);
    const items = assets
      .filter((a) => a && a.uri)
      .map((a) => ({ uri: a.uri, name: a.fileName || fileNameOf(a.uri), size: Number.isFinite(a.fileSize) ? a.fileSize : null, mimeType: a.mimeType || null }));
    if (items.length === 0) return { status: 'cancelled', items: [], message: '' };
    return { status: 'picked', items, message: '' };
  } catch (error) {
    return {
      status: 'error',
      items: [],
      message: 'Couldn’t open your library. Check this app’s photo permission in Settings, or paste a link instead.',
    };
  }
}

// multiple: allow choosing several images at once. cover: crop to a 3:4 cover. avatar: square crop.
export function pickImages({ multiple = false, cover = false, avatar = false } = {}) {
  const options = avatar
    ? { allowsEditing: true, aspect: [1, 1] }
    : cover ? { allowsEditing: true, aspect: [3, 4] } : multiple ? { allowsMultipleSelection: true } : {};
  return pick('images', options);
}

export function pickVideo() {
  return pick('videos', {});
}

// Accepts an http(s) link. Returns { ok, uri, message }.
export function normalizeLink(input) {
  const uri = String(input || '').trim();
  if (!uri) return { ok: false, uri: '', message: 'Paste a link first.' };
  if (!/^https?:\/\/[^\s]+\.[^\s]+$/i.test(uri)) {
    return { ok: false, uri: '', message: 'That doesn’t look like a web link. It should start with https://' };
  }
  return { ok: true, uri, message: '' };
}
