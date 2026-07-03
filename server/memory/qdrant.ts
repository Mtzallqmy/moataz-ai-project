import { QdrantClient } from '@qdrant/js-client-rest';

const client = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY,
});

export class MemoryService {
  private collectionName = 'project_brain';

  async init() {
    try {
      await client.createCollection(this.collectionName, {
        vectors: { size: 1536, distance: 'Cosine' },
      });
    } catch (e) {
      console.log('Collection already exists or Qdrant unavailable');
    }
  }

  async addMemory(projectId: string, content: string, vector: number[]) {
    await client.upsert(this.collectionName, {
      wait: true,
      points: [
        {
          id: Math.random().toString(36).substring(7),
          vector,
          payload: { projectId, content, timestamp: new Date().toISOString() },
        },
      ],
    });
  }

  async search(projectId: string, vector: number[], limit = 5) {
    return await client.search(this.collectionName, {
      vector,
      filter: {
        must: [{ key: 'projectId', match: { value: projectId } }],
      },
      limit,
    });
  }
}

export const memoryService = new MemoryService();
