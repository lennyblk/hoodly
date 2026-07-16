import { Neo4jService } from './neo4j.service';

describe('Neo4jService', () => {
  let service: Neo4jService;

  const mockSession = {
    run: jest.fn(),
    close: jest.fn(),
  };

  beforeEach(() => {
    service = new Neo4jService();
    (service as any).driver = {
      session: () => mockSession,
      close: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('run', () => {
    it('executes cypher query and closes session', async () => {
      const fakeResult = { records: [] };
      mockSession.run.mockResolvedValue(fakeResult);

      const result = await service.run('MATCH (n) RETURN n');

      expect(mockSession.run).toHaveBeenCalledWith('MATCH (n) RETURN n', {});
      expect(mockSession.close).toHaveBeenCalled();
      expect(result).toBe(fakeResult);
    });

    it('closes session even on error', async () => {
      mockSession.run.mockRejectedValue(new Error('neo4j down'));

      await expect(service.run('BAD QUERY')).rejects.toThrow('neo4j down');
      expect(mockSession.close).toHaveBeenCalled();
    });
  });
});
