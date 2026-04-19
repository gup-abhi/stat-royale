import { Request, Response, NextFunction } from 'express';

// V1
export const decksController = {
  getPopular: async (_req: Request, _res: Response, _next: NextFunction): Promise<void> => {
    // TODO: V1-007
  },
  search: async (_req: Request, _res: Response, _next: NextFunction): Promise<void> => {
    // TODO: V1-006
  },
  getSaved: async (_req: Request, _res: Response, _next: NextFunction): Promise<void> => {
    // TODO: V1-009
  },
  saveDeck: async (_req: Request, _res: Response, _next: NextFunction): Promise<void> => {
    // TODO: V1-009
  },
  deleteSaved: async (_req: Request, _res: Response, _next: NextFunction): Promise<void> => {
    // TODO: V1-009
  },
};
