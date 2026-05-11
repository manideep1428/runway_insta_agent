/**
 * Instagram Graph API Client for Content Publishing
 * Supports Resumable Uploads (Large Videos) and Carousel Posts.
 */

const API_VERSION = 'v25.0';
const GRAPH_HOST = 'https://graph.instagram.com';

export interface InstagramUploadOptions {
  accessToken: string;
  instagramUserId: string;
}

export interface ResumableContainerOptions {
  mediaType: 'REELS' | 'STORIES' | 'VIDEO' | 'IMAGE';
  isCarouselItem?: boolean;
  caption?: string;
  locationId?: string;
  userTags?: { username: string; x: number; y: number }[];
  altText?: string;
  collaborators?: string[];
  coverUrl?: string;
  audioName?: string;
  thumbOffset?: number;
  trialParams?: {
    graduation_strategy: 'MANUAL' | 'SS_PERFORMANCE';
  };
}

export interface CarouselOptions {
  children: string[];
  caption?: string;
  locationId?: string;
  collaborators?: string[];
}

export interface UploadStatusResponse {
  id: string;
  status_code: 'FINISHED' | 'IN_PROGRESS' | 'ERROR' | 'EXPIRED' | 'PUBLISHED';
  status: string;
  video_status?: {
    uploading_phase: {
      status: 'complete' | 'in_progress';
      bytes_transferred: number;
    };
    processing_phase: {
      status: 'complete' | 'in_progress' | 'not_started';
    };
  };
}

export interface CarouselItem {
  mediaType: 'IMAGE' | 'VIDEO';
  url: string; // Remote URL for image or video
  altText?: string;
  userTags?: { username: string; x: number; y: number }[];
}

export class InstagramClient {
  private accessToken: string;
  private userId: string;

  constructor(options: InstagramUploadOptions) {
    this.accessToken = options.accessToken;
    this.userId = options.instagramUserId;
  }

  /**
   * Helper: Publish a complete carousel post
   */
  async publishCarousel(options: CarouselOptions & { items: CarouselItem[] }): Promise<string> {
    const childIds: string[] = [];

    // 1. Process all items
    for (const item of options.items) {
      if (item.mediaType === 'IMAGE') {
        const container = await this.createContainer({
          mediaType: 'IMAGE',
          imageUrl: item.url,
          isCarouselItem: true,
          altText: item.altText,
          userTags: item.userTags
        });
        childIds.push(container.id);
      } else {
        const container = await this.createContainer({
          mediaType: 'VIDEO',
          isCarouselItem: true,
          // Videos in carousels use resumable flow
        });
        await this.uploadVideoData(container.uri!, { url: item.url });
        childIds.push(container.id);
      }
    }

    // 2. Wait for all children to be ready
    await Promise.all(childIds.map(id => this.waitForContainer(id)));

    // 3. Create carousel container
    const carouselContainerId = await this.createCarousel({
      ...options,
      children: childIds
    });

    // 4. Wait for carousel container
    await this.waitForContainer(carouselContainerId);

    // 5. Publish
    return await this.publish(carouselContainerId);
  }

  /**
   * Helper: Publish a single image or video (including Reels)
   */
  async publishSingleMedia(options: ResumableContainerOptions & { url: string; isLocal?: boolean }): Promise<string> {
    let containerId: string;

    if (options.mediaType === 'IMAGE') {
      const container = await this.createContainer({
        ...options,
        imageUrl: options.url
      });
      containerId = container.id;
    } else {
      const container = await this.createContainer({
        ...options
        // Videos use resumable flow
      });
      await this.uploadVideoData(container.uri!, { url: options.url });
      containerId = container.id;
    }

    await this.waitForContainer(containerId);
    return await this.publish(containerId);
  }

  /**
   * Step 1: Initialize a resumable upload session or create a simple container
   */
  async createContainer(options: ResumableContainerOptions & { videoUrl?: string; imageUrl?: string }): Promise<{ id: string; uri?: string }> {
    const url = `${GRAPH_HOST}/${API_VERSION}/${this.userId}/media`;
    
    const payload: any = {
      access_token: this.accessToken,
      media_type: options.mediaType,
      is_carousel_item: options.isCarouselItem || false,
    };

    if (options.caption) payload.caption = options.caption;
    if (options.locationId) payload.location_id = options.locationId;
    if (options.userTags) payload.user_tags = JSON.stringify(options.userTags);
    if (options.altText) payload.alt_text = options.altText;
    if (options.collaborators) payload.collaborators = options.collaborators.join(',');
    if (options.coverUrl) payload.cover_url = options.coverUrl;
    if (options.audioName) payload.audio_name = options.audioName;
    if (options.thumbOffset !== undefined) payload.thumb_offset = options.thumbOffset;
    if (options.trialParams) payload.trial_params = JSON.stringify(options.trialParams);

    if (options.videoUrl || options.imageUrl) {
      // Direct URL upload (non-resumable)
      if (options.videoUrl) payload.video_url = options.videoUrl;
      if (options.imageUrl) payload.image_url = options.imageUrl;
    } else {
      // Resumable upload initialization
      payload.upload_type = 'resumable';
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Instagram API Error (Create Container): ${await res.text()}`);
    }

    return await res.json();
  }

  /**
   * Step 2: Upload Video Data for Resumable Sessions
   */
  async uploadVideoData(uploadUri: string, videoSource: { url?: string; buffer?: Buffer; size?: number }): Promise<any> {
    const headers: Record<string, string> = {
      'Authorization': `OAuth ${this.accessToken}`
    };

    if (videoSource.buffer) {
      // Local Buffer Upload
      headers['offset'] = '0';
      headers['file_size'] = (videoSource.size || videoSource.buffer.length).toString();
      
      const res = await fetch(uploadUri, {
        method: 'POST',
        headers,
        body: new Uint8Array(videoSource.buffer)
      });

      if (!res.ok) throw new Error(`Instagram API Error (Binary Upload): ${await res.text()}`);
      return await res.json();
    } else if (videoSource.url) {
      // Remote URL Upload via Resumable URI
      headers['file_url'] = videoSource.url;
      const res = await fetch(uploadUri, {
        method: 'POST',
        headers
      });

      if (!res.ok) throw new Error(`Instagram API Error (Remote Upload): ${await res.text()}`);
      return await res.json();
    } else {
      throw new Error("Either buffer or url must be provided for video upload.");
    }
  }

  /**
   * Step 3: Create Carousel Container
   */
  async createCarousel(options: CarouselOptions): Promise<string> {
    const url = `${GRAPH_HOST}/${API_VERSION}/${this.userId}/media`;
    const payload: any = {
      access_token: this.accessToken,
      media_type: 'CAROUSEL',
      children: options.children.join(','),
    };

    if (options.caption) payload.caption = options.caption;
    if (options.locationId) payload.location_id = options.locationId;
    if (options.collaborators) payload.collaborators = options.collaborators.join(',');

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Instagram API Error (Create Carousel): ${await res.text()}`);
    }

    const data = await res.json();
    return data.id;
  }

  /**
   * Step 4: Check Publishing Eligibility and Status
   */
  async getContainerStatus(containerId: string): Promise<UploadStatusResponse> {
    const url = `${GRAPH_HOST}/${API_VERSION}/${containerId}?fields=id,status,status_code,video_status&access_token=${this.accessToken}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Instagram API Error (Status Check): ${await res.text()}`);
    }
    return await res.json();
  }

  /**
   * Step 5: Publish the Container
   */
  async publish(containerId: string): Promise<string> {
    const url = `${GRAPH_HOST}/${API_VERSION}/${this.userId}/media_publish`;
    const payload = {
      access_token: this.accessToken,
      creation_id: containerId
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Instagram API Error (Publish): ${await res.text()}`);
    }

    const data = await res.json();
    return data.id;
  }

  /**
   * Helper: Wait for container to be ready
   */
  async waitForContainer(containerId: string, maxAttempts = 30, intervalMs = 10000): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getContainerStatus(containerId);
      if (status.status_code === 'FINISHED') return;
      if (status.status_code === 'ERROR' || status.status_code === 'EXPIRED') {
        throw new Error(`Container failed: ${status.status}`);
      }
      await new Promise(r => setTimeout(r, intervalMs));
    }
    throw new Error("Timeout waiting for container to be ready.");
  }
}
