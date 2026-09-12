import { Kafka, Partitioners } from "kafkajs";

const kafka = new Kafka({
  clientId: 'linkforge-api',
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

export const producer = kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner });
export const KAFKA_TOPIC_CLICKS = "url-clicks";

export interface ClickEventPayload {
  eventId: string;
  shortCode: string;
  clickedAt: string;
  ipAddress: string;
  userAgent: string;
  referer?: string;
}

export const initKafkaProducer = async (): Promise<void> => {
  try {
    await producer.connect();
    console.log("✅ Kafka Producer connected to broker");
  } catch (error) {
    console.error("❌ Failed to connect Kafka Producer:", error);
  }
};

export const disconnectKafkaProducer = async (): Promise<void> => {
  try {
    await producer.disconnect();
    console.log("Kafka Producer disconnected");
  } catch (error) {
    console.error("Error disconnecting Kafka Producer:", error);
  }
};

export const emitClickEvent = async (event: ClickEventPayload): Promise<void> => {
  try {
    await producer.send({
      topic: KAFKA_TOPIC_CLICKS,
      messages: [
        {
          key: event.shortCode, // Partition Key: ensures same shortCode routes to same partition!
          value: JSON.stringify(event),
        },
      ],
    });
  } catch (error) {
    // Graceful Degradation: Log error, but NEVER throw to break user redirection!
    console.error(`❌ Failed to produce click event for ${event.shortCode}:`, error);
  }
};
