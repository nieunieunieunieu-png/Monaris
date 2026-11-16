
'use strict';

const {
  Events,
  PermissionFlagsBits
} = require('discord.js');

const client = require('../client');

const GUILD_ID = '1566691700850688013';
const PLAYER_ROLE_ID = '1566701282369077380';

if (!client.__monarisAutoRoleInstalled) {
  client.__monarisAutoRoleInstalled = true;

  client.on(Events.GuildMemberAdd, async (member) => {
    if (member.guild.id !== GUILD_ID) return;

    try {
      const botMember = await member.guild.members.fetchMe();

      if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
        console.error('[AutoRole] Monaris thiếu quyền Manage Roles.');
        return;
      }

      const role = await member.guild.roles.fetch(
        PLAYER_ROLE_ID
      );

      if (!role) {
        console.error('[AutoRole] Không tìm thấy role Người Chơi.');
        return;
      }

      if (!role.editable) {
        console.error('[AutoRole] Role Người Chơi cao hơn role Monaris.');
        return;
      }

      if (member.roles.cache.has(PLAYER_ROLE_ID)) return;

      await member.roles.add(
        role,
        'Monaris: Tự động cấp role Người Chơi khi vào server'
      );

      console.log(
        `[AutoRole] Đã cấp Người Chơi cho ${member.user.tag}`
      );

    } catch (error) {
      console.error('[AutoRole] Lỗi cấp role:', error.message);
    }
  });
}

module.exports = {
  PLAYER_ROLE_ID
};
