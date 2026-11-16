function getSlashCommands() {
  const groups = [
    ['./help', 'SLASH_COMMANDS'], ['./about', 'ABOUT_SLASH_COMMANDS'],
    ['../nmImage', 'NMIMAGE_SLASH_COMMANDS'],
    ['../monitoring/statusCommand', 'STATUS_SLASH_COMMANDS'],
    ['../monitoring/healthCheck', 'HEALTH_SLASH_COMMANDS'],
    ['../activityLog/logSearch', 'LOGSEARCH_SLASH_COMMANDS'],
    ['../whoTagMe', 'WHOTAGME_SLASH_COMMANDS'], ['../character', 'CHARACTER_SLASH_COMMANDS']
  ];
  return groups.flatMap(([modulePath, key]) => require(modulePath)[key]);
}
module.exports = { getSlashCommands };
