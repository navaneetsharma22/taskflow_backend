const crypto = require("crypto");
const WebhookSubscription = require("../models/WebhookSubscription");

class WebhookService {
  /**
   * Broadcast an event payload to all active webhook subscribers of the organization
   */
  async trigger(organizationId, eventName, data) {
    try {
      // Find active subscriptions in the organization listening to this event
      // (Mongoose automatically filters by organizationId due to our tenantPlugin!)
      const subscriptions = await WebhookSubscription.find({
        events: eventName,
        isActive: true,
      });

      if (!subscriptions || subscriptions.length === 0) {
        return;
      }

      const timestamp = Date.now().toString();
      const payload = {
        event: eventName,
        timestamp,
        data,
      };

      const payloadString = JSON.stringify(payload);

      // Asynchronously trigger all endpoints
      subscriptions.forEach((sub) => {
        this.deliverWebhook(sub, payloadString, eventName, timestamp);
      });
    } catch (error) {
      console.error("Webhook trigger error:", error.message);
    }
  }

  /**
   * Asynchronously deliver the webhook payload to the endpoint
   */
  async deliverWebhook(subscription, payloadString, eventName, timestamp) {
    try {
      // 1. Calculate the signature using HMAC SHA-256 with the private secret
      const signature = crypto
        .createHmac("sha256", subscription.secret)
        .update(payloadString)
        .digest("hex");

      // 2. Dispatch using Node's global fetch API
      const response = await fetch(subscription.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-TaskFlow-Event": eventName,
          "X-TaskFlow-Signature": signature,
          "X-TaskFlow-Timestamp": timestamp,
          "User-Agent": "TaskFlow-Webhook-Dispatcher/1.0",
        },
        body: payloadString,
        signal: AbortSignal.timeout(5000), // 5 seconds timeout
      });

      if (!response.ok) {
        console.warn(`Webhook delivery failed for ${subscription.url} with status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Webhook delivery error for ${subscription.url}:`, error.message);
    }
  }
}

module.exports = new WebhookService();
