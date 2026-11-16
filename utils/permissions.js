'use strict';

const { isBong } = require('./bongPermission');

function hasChatFeatureAccess(_userId, member) {
  return isBong(member);
}

module.exports = { hasChatFeatureAccess };
