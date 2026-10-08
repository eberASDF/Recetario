import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

export class ProfileImageService {
  async copyToDocuments(sourceUri: string): Promise<string> {
    if (Platform.OS === 'web') throw new Error('profile-image-web-unsupported');
    const directory = new Directory(Paths.document, 'profile-images');
    directory.create({ idempotent: true, intermediates: true });
    const source = new File(sourceUri);
    const extension = /^\.(jpe?g|png|webp|heic)$/i.test(source.extension) ? source.extension.toLowerCase() : '.jpg';
    const destination = new File(directory, `${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`);
    try {
      await source.copy(destination);
    } catch (error) {
      if (destination.exists) destination.delete();
      throw error;
    }
    return destination.uri;
  }

  deleteOwned(uri: string | null): void {
    if (!uri || Platform.OS === 'web') return;
    const directory = new Directory(Paths.document, 'profile-images');
    const prefix = `${directory.uri.replace(/\/$/, '')}/`;
    if (!uri.startsWith(prefix) || !/^\d+-[a-z0-9]+\.(jpe?g|png|webp|heic)$/i.test(uri.slice(prefix.length))) return;
    const file = new File(uri);
    if (file.exists) file.delete();
  }
}
