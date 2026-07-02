import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import jobsRouter from "./jobs";
import candidatesRouter from "./candidates";
import rankingRouter from "./ranking";
import adversaryRouter from "./adversary";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(jobsRouter);
router.use(candidatesRouter);
router.use(rankingRouter);
router.use(adversaryRouter);
router.use(analyticsRouter);

export default router;
