import { InstagramClient, CarouselItem, ResumableContainerOptions } from './instagram';

export const INSTAGRAM_TOOL_SCHEMAS = [
  {
    type: 'function' as const,
    function: {
      name: 'instagram_post_single_media',
      description: 'Post a single image or video to Instagram.',
      parameters: {
        type: 'object',
        properties: {
          mediaType: {
            type: 'string',
            enum: ['IMAGE', 'VIDEO', 'REELS', 'STORIES'],
            description: 'The type of media to post.',
          },
          url: {
            type: 'string',
            description: 'The public URL of the image or video to post.',
          },
          caption: {
            type: 'string',
            description: 'The caption for the post.',
          },
        },
        required: ['mediaType', 'url'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'instagram_post_carousel',
      description: 'Post a carousel (multiple images/videos) to Instagram.',
      parameters: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                mediaType: {
                  type: 'string',
                  enum: ['IMAGE', 'VIDEO'],
                },
                url: {
                  type: 'string',
                },
              },
              required: ['mediaType', 'url'],
            },
            description: 'List of items in the carousel (up to 10).',
          },
          caption: {
            type: 'string',
            description: 'The caption for the carousel post.',
          },
        },
        required: ['items'],
      },
    },
  },
];

export async function handleInstagramToolCall(
  name: string,
  args: any,
  accessToken: string,
  instagramUserId: string
) {
  const client = new InstagramClient({ accessToken, instagramUserId });

  switch (name) {
    case 'instagram_post_single_media': {
      const { mediaType, url, caption } = args;
      const mediaId = await client.publishSingleMedia({
        mediaType: mediaType as any,
        url,
        caption,
      });
      return { success: true, mediaId, message: 'Successfully posted to Instagram.' };
    }

    case 'instagram_post_carousel': {
      const { items, caption } = args;
      const mediaId = await client.publishCarousel({
        items: items as CarouselItem[],
        caption,
        children: [], // Handled inside publishCarousel
      });
      return { success: true, mediaId, message: 'Successfully posted carousel to Instagram.' };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
