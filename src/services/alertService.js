/**
 * Silent Alert Service
 * Sends emergency notifications to parents WITHOUT user knowledge
 * when critical stress levels are detected.
 */

const TWILIO_ENDPOINT = 'https://api.twilio.com/2010-04-01/Accounts'; // placeholder

// In production, these would be environment variables
const TWILIO_SID = 'YOUR_TWILIO_SID';
const TWILIO_AUTH = 'YOUR_TWILIO_AUTH_TOKEN';
const TWILIO_FROM = '+1234567890';

/**
 * Send a silent SMS alert to parent contacts
 * This runs in the background with NO user-facing UI
 */
export async function sendSilentParentAlert({ studentName, contacts, triggerReason, stressScore, timestamp }) {
  const alertMessage = `MindEase URGENT Alert: ${studentName} is showing signs of severe distress. ` +
    `Stress level: ${stressScore}/100 (${triggerReason}). ` +
    `Detected at ${new Date(timestamp).toLocaleTimeString()}. ` +
    `Please check in with them immediately. — MindEase Safety System`;

  const results = [];

  for (const phone of contacts) {
    if (!phone) continue;
    try {
      // In production, this would be a real Twilio API call:
      // const response = await fetch(`${TWILIO_ENDPOINT}/${TWILIO_SID}/Messages.json`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': 'Basic ' + btoa(`${TWILIO_SID}:${TWILIO_AUTH}`),
      //     'Content-Type': 'application/x-www-form-urlencoded',
      //   },
      //   body: `To=${phone}&From=${TWILIO_FROM}&Body=${encodeURIComponent(alertMessage)}`,
      // });

      // For now, simulate the SMS send
      console.log(`[SILENT ALERT] SMS sent to ${phone}: ${alertMessage}`);

      results.push({
        phone,
        status: 'sent',
        timestamp: Date.now(),
        message: alertMessage,
      });
    } catch (error) {
      console.error(`[SILENT ALERT] Failed to send to ${phone}:`, error);
      results.push({
        phone,
        status: 'failed',
        timestamp: Date.now(),
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Determines if a silent alert should fire based on stress score
 * Thresholds:
 *   - Score >= 85: CRITICAL — immediate silent alert
 *   - Score >= 70 sustained for 3+ scans: ELEVATED — silent alert
 */
export function shouldTriggerSilentAlert(stressScore, scanHistory = []) {
  // Critical threshold — immediate silent alert
  if (stressScore >= 85) {
    return { trigger: true, reason: 'Critical stress level detected (>=85)' };
  }

  // Sustained elevated stress — 3+ consecutive scans above 70
  const recentScans = [...scanHistory, stressScore].slice(-3);
  if (recentScans.length >= 3 && recentScans.every(s => s >= 70)) {
    return { trigger: true, reason: 'Sustained high stress across multiple scans' };
  }

  return { trigger: false, reason: null };
}

/**
 * Cooldown manager — prevents alert spam
 * Only allows 1 silent alert per 30 minutes
 */
const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
let lastSilentAlertTime = 0;

export function canSendSilentAlert() {
  const now = Date.now();
  if (now - lastSilentAlertTime < COOLDOWN_MS) {
    return false;
  }
  return true;
}

export function markSilentAlertSent() {
  lastSilentAlertTime = Date.now();
}
