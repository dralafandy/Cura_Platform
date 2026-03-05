import type { Request, Response, NextFunction } from 'express';
import type { PoolClient } from 'pg';

/**
 * Express middleware factory for per-request branch DB session scoping.
 *
 * Usage:
 * app.use(branchScopeMiddleware(async () => pool.connect()));
 */
export const branchScopeMiddleware = (
  getClient: () => Promise<PoolClient>,
  branchResolver: (req: Request) => string | null = (req) => {
    const fromHeader = (req.headers['x-branch-id'] as string | undefined)?.trim();
    if (fromHeader) return fromHeader;
    const jwtBranch = (req as any).user?.branch_id as string | undefined;
    return jwtBranch?.trim() || null;
  },
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const branchId = branchResolver(req);
    if (!branchId) {
      res.status(400).json({ error: 'Missing branch context' });
      return;
    }

    let client: PoolClient | null = null;
    try {
      client = await getClient();
      await client.query('SELECT public.set_current_branch($1::uuid)', [branchId]);
      (req as any).dbClient = client;

      res.on('finish', () => {
        try {
          client?.release();
        } catch {
          // ignore release failures on completed response
        }
      });

      next();
    } catch (error) {
      try {
        client?.release();
      } catch {
        // ignore release failures during error handling
      }
      next(error);
    }
  };
};
