import type { UserRepository } from '@/repositories/contracts';
import type { UserProfile } from '@/types';
import type { ProfileImageService } from './ProfileImageService';

export class ProfileService {
  private readonly repository: UserRepository;
  private readonly images: ProfileImageService;

  constructor(
    repository: UserRepository,
    images: ProfileImageService,
  ) {
    this.repository = repository;
    this.images = images;
  }

  getProfile(): Promise<UserProfile | null> {
    return this.repository.getProfile();
  }

  async savePhoto(sourceUri: string): Promise<UserProfile> {
    const profile = await this.repository.getProfile();
    if (!profile) throw new Error('profile-missing');
    const photoUri = await this.images.copyToDocuments(sourceUri);
    const updated = { ...profile, photoUri };
    try {
      await this.repository.saveProfile(updated);
    } catch (error) {
      try { this.images.deleteOwned(photoUri); } catch { /* Preserve the storage error. */ }
      throw error;
    }
    try { this.images.deleteOwned(profile.photoUri); } catch { /* The new image is already persisted. */ }
    return updated;
  }
}
