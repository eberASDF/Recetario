// Development-only visual preview. It never changes Firestore access or free recipe IDs.
export class MockSubscriptionPreviewService {
  private active = false;

  isActive(): boolean {
    return this.active;
  }

  activate(): void {
    this.active = true;
  }
}

export const mockSubscriptionPreviewService = new MockSubscriptionPreviewService();
