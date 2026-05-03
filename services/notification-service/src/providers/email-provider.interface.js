/**
 * @typedef {Object} EmailProvider
 * @property {() => Promise<any>} initialise
 * @property {(input: {to: string, subject: string, html?: string, text?: string, metadata?: object}, context?: object) => Promise<{ok: boolean, providerMessageId: string}>} sendEmail
 * @property {() => Promise<any>} healthCheck
 */

module.exports = {};
