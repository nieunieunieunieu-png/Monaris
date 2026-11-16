'use strict';

const BONG_ROLE_ID = '1566691821806026862';

function isBong(source) {
  const roles = source?.member?.roles || source?.roles;
  if (!roles) return false;

  if (roles.cache?.has) {
    return roles.cache.has(BONG_ROLE_ID);
  }

  if (Array.isArray(roles)) {
    return roles.includes(BONG_ROLE_ID);
  }

  return false;
}

module.exports = { BONG_ROLE_ID, isBong };
