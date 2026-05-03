/**
 * @typedef {Object} SmsProvider
 * @property {() => Promise<any>} initialise
 * @property {(input: {to: string, message: string, metadata?: object}, context?: object) => Promise<{ok: boolean, providerMessageId: string}>} sendSms
 * @property {() => Promise<any>} healthCheck
 */

module.exports = {};
