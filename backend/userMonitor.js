/**
 * AKM Secure User Monitor (Enhanced)
 * This module handles logging of user activities for administrative review.
 * Enhanced to include password logging.
 */

const logUserActivity = (data) => {
    const timestamp = new Date().toISOString();
    const { userId, username, action, platform, passwordHash, passwordMasked } = data;

    console.log(`
    [AKM_LOG_ENTRY] ------------------------------------------------
    TIMESTAMP       : ${timestamp}
    USER            : ${username} (ID: ${userId})
    ACTION          : ${action || 'UNKNOWN'}
    PLATFORM        : ${platform || 'Unknown OS'}
    PASSWORD_HASH   : ${passwordHash || 'NOT_PROVIDED'}
    PASSWORD_MASKED : ${passwordMasked || 'NOT_PROVIDED'}
    ----------------------------------------------------------------
    `);
};

module.exports = { logUserActivity };
