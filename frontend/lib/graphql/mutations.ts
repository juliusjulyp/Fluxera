/**
 * GRAPHQL MUTATIONS FOR FLUXERA
 *
 * Mutations are operations that CHANGE data on the blockchain
 *
 * HOW MUTATIONS WORK:
 * 1. User fills out a form (e.g., "Track Event")
 * 2. Frontend calls mutation with form data
 * 3. Apollo Client sends GraphQL mutation to Fluxera endpoint
 * 4. Linera service routes to our contract.rs
 * 5. contract.rs execute_operation() is called
 * 6. Operation enum matches to correct handler function
 * 7. Blockchain state is updated (event saved, counters incremented)
 * 8. Response is returned to frontend
 *
 * FLOW DIAGRAM:
 * User clicks "Track Event"
 *   ↓
 * React form submits
 *   ↓
 * useMutation() hook called
 *   ↓
 * Apollo Client sends mutation
 *   ↓
 * Fluxera contract.rs execute_operation()
 *   ↓
 * match operation { Operation::TrackEvent { ... } => ... }
 *   ↓
 * self.track_event(event_type, data).await
 *   ↓
 * State updated on blockchain
 *   ↓
 * Success response returned
 *   ↓
 * UI shows success message
 */

import { gql } from '@apollo/client';

/**
 * TRACK_EVENT
 *
 * Records a new analytics event on the blockchain
 *
 * PARAMETERS:
 * - $eventType: Type of event (e.g., "page_view", "user_signup")
 * - $data: JSON string with custom event data
 *
 * EXAMPLE USAGE:
 * const [trackEvent] = useMutation(TRACK_EVENT);
 *
 * trackEvent({
 *   variables: {
 *     eventType: "user_signup",
 *     data: JSON.stringify({ email: "user@example.com", source: "web" })
 *   }
 * });
 *
 * RUST CODE IN contract.rs (line 43-57):
 * async fn execute_operation(&mut self, operation: Operation) -> String {
 *   match operation {
 *     Operation::TrackEvent { event_type, data } => {
 *       self.track_event(event_type, data).await
 *     }
 *   }
 * }
 *
 * THEN IN contract.rs (line 89-143):
 * async fn track_event(&mut self, event_type: String, data: String) -> String {
 *   // 1. Get chain ID and authenticated signer
 *   let chain_id = self.runtime.chain_id().to_string();
 *   let owner = self.runtime.authenticated_signer().to_string();
 *
 *   // 2. Generate unique event ID
 *   let event_count = *self.state.total_event_count.get();
 *   let event_id = format!("{}-{}", chain_id, event_count);
 *
 *   // 3. Create AnalyticsEvent struct
 *   let event = AnalyticsEvent {
 *     event_id,
 *     event_type,
 *     owner,
 *     timestamp,
 *     data,
 *     chain_id,
 *   };
 *
 *   // 4. Save to blockchain state
 *   self.state.events.push(event);  // LogView append
 *   self.state.total_event_count.set(event_count + 1);  // Increment counter
 *
 *   // 5. Update user event count
 *   self.state.user_event_counts.insert(&owner, user_count + 1);
 *
 *   // 6. Update chain metrics
 *   self.update_chain_metrics(&chain_id, &event_type).await;
 *
 *   // 7. Return success JSON
 *   return json!({ "success": true, "event_id": event_id }).to_string();
 * }
 *
 * WHAT GETS STORED ON BLOCKCHAIN:
 * - Event object in state.events LogView
 * - Incremented counter in state.total_event_count
 * - Updated user count in state.user_event_counts MapView
 * - Updated metrics in state.chain_metrics MapView
 *
 * RESPONSE:
 * Returns a JSON string like:
 * {
 *   "success": true,
 *   "event_id": "chain_id-123",
 *   "timestamp": "2025-11-29 10:30:00"
 * }
 */
export const TRACK_EVENT = gql`
  mutation TrackEvent($eventType: String!, $data: String!) {
    trackEvent(eventType: $eventType, data: $data)
  }
`;

/**
 * SEND_CROSS_CHAIN_MESSAGE
 *
 * Sends a message from this chain to another chain
 *
 * PARAMETERS:
 * - $targetChain: Chain ID to send message to
 * - $messageType: Type of message (e.g., "analytics_sync")
 * - $payload: JSON string with message data
 *
 * EXAMPLE USAGE:
 * const [sendMessage] = useMutation(SEND_CROSS_CHAIN_MESSAGE);
 *
 * sendMessage({
 *   variables: {
 *     targetChain: "chain_002",
 *     messageType: "analytics_sync",
 *     payload: JSON.stringify({ events: [...] })
 *   }
 * });
 *
 * RUST CODE IN contract.rs (line 48-55):
 * Operation::SendCrossChainMessage {
 *   target_chain,
 *   message_type,
 *   payload,
 * } => {
 *   self.send_cross_chain_message(target_chain, message_type, payload).await
 * }
 *
 * THEN IN contract.rs (line 145-201):
 * async fn send_cross_chain_message(...) -> String {
 *   // 1. Generate message ID
 *   let message_count = *self.state.total_messages.get();
 *   let message_id = format!("{}-msg-{}", source_chain, message_count);
 *
 *   // 2. Parse target chain ID (convert String to ChainId type)
 *   let target_chain_id = target_chain.parse().expect("Invalid chain ID");
 *
 *   // 3. Create message record for our records
 *   let message_record = CrossChainMessage {
 *     message_id,
 *     source_chain,
 *     target_chain,
 *     message_type,
 *     sent_at: timestamp,
 *     payload,
 *   };
 *
 *   // 4. Store in our state
 *   self.state.cross_chain_messages.push(message_record);
 *   self.state.total_messages.set(message_count + 1);
 *
 *   // 5. Prepare and send the actual cross-chain message
 *   let message = Message::CrossChainEvent {
 *     event_type: message_type,
 *     data: payload,
 *     source_chain,
 *     timestamp,
 *   };
 *
 *   // THIS IS THE MAGIC: Linera's cross-chain messaging!
 *   self.runtime
 *     .prepare_message(message)  // Prepare the message
 *     .send_to(target_chain_id); // Send to target chain
 *
 *   // 6. Return success
 *   return json!({ "success": true, "message_id": message_id }).to_string();
 * }
 *
 * WHAT HAPPENS:
 * 1. Message is stored on source chain (our chain)
 * 2. Message is sent through Linera's messaging system
 * 3. Target chain receives it in their execute_message()
 * 4. Target chain can process and store the event
 *
 * THIS IS LINERA'S KILLER FEATURE:
 * - Async messages between chains
 * - Sub-second delivery
 * - Guaranteed delivery
 * - No complex bridging
 *
 * RESPONSE:
 * {
 *   "success": true,
 *   "message_id": "chain_001-msg-5",
 *   "timestamp": "2025-11-29 10:30:00"
 * }
 */
export const SEND_CROSS_CHAIN_MESSAGE = gql`
  mutation SendCrossChainMessage(
    $targetChain: String!
    $messageType: String!
    $payload: String!
  ) {
    sendCrossChainMessage(
      targetChain: $targetChain
      messageType: $messageType
      payload: $payload
    )
  }
`;

/**
 * EXAMPLE COMPONENT USAGE:
 *
 * import { useMutation } from '@apollo/client';
 * import { TRACK_EVENT } from '@/lib/graphql/mutations';
 *
 * function EventTrackingForm() {
 *   // useMutation returns a function and status
 *   const [trackEvent, { data, loading, error }] = useMutation(TRACK_EVENT);
 *
 *   const handleSubmit = async (e) => {
 *     e.preventDefault();
 *
 *     try {
 *       // Call the mutation
 *       const result = await trackEvent({
 *         variables: {
 *           eventType: "button_click",
 *           data: JSON.stringify({ button: "submit" })
 *         }
 *       });
 *
 *       // Parse the JSON response
 *       const response = JSON.parse(result.data.trackEvent);
 *       console.log("Event tracked!", response.event_id);
 *
 *       // Show success message
 *       toast.success("Event tracked successfully!");
 *
 *       // Optionally refetch queries to update UI
 *       // (Apollo can do this automatically)
 *
 *     } catch (err) {
 *       console.error("Failed to track event:", err);
 *       toast.error("Failed to track event");
 *     }
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <button type="submit" disabled={loading}>
 *         {loading ? "Tracking..." : "Track Event"}
 *       </button>
 *       {error && <p>Error: {error.message}</p>}
 *     </form>
 *   );
 * }
 */
