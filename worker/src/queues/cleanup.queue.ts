import { Queue } from 'bullmq';
import { redis } from "../lib/redis";

export const CLEANUP_QUEUE_NAME = 'url-cleanup';

export const cleanUpQueue = new Queue(CLEANUP_QUEUE_NAME, { connection: redis });