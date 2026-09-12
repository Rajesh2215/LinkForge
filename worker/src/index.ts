
import { startAnalyticsConsumer } from "./consumers/analytics.consumer";
import "./scheduler";
import "./workers/cleanup.worker";

startAnalyticsConsumer().catch((err) => {
  console.error("❌ Failed to start Analytics Consumer:", err);
});