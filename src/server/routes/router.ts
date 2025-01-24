import { Request, Response, Router } from 'express';

const router = Router();

router.get('/get-sum-for-3-and-5', (_req: Request, res: Response) => {
  const three = 3;
  const five = 5;

  const sum = three + five;

  res.status(200).send({ sum });
});

export { router };
