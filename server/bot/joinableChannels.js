var roleBasedChannels = [{
  name: "industry",
  roleName: "Industry",
  protected: 1,
  description: "Coordination of the FEDUP and allies(tm) Industrial effort.",
  grantAccess: function (user, guild) {
    return addRole("Industry", user, guild);
  }
}, {
  name: "lore",
  roleName: "lore",
  protected: 0,
  description: "The lore of the EVE Universe",
  grantAccess: function (user, guild) {
    return addRole("lore", user, guild);
  }
}, {
  name: "fleet-support",
  roleName: "support",
  protected: 1,
  description: "Focused around the act of keeping our fleet members alive disrupting enemy forces and general support of main fleet.",
  grantAccess: function (user, guild) {
    return addRole("support", user, guild);
  }
}, {
  name: "doctrines",
  roleName: "doctrines",
  protected: 1,
  description: "FEDUP active and experimental doctrines.",
  grantAccess: function (user, guild) {
    return addRole("doctrines", user, guild);
  }
}, {
  name: "propaganda",
  roleName: "propaganda",
  protected: 1,
  description: "Coordination of the development and production of FEDUP propaganda.",
  grantAccess: function (user, guild) {
    return addRole("propaganda", user, guild);
  }
}, {
  name: "creative",
  roleName: "Creative",
  protected: 1,
  description: "Anything creative discussed here. Cooking, Art, Design, Photography, Youtube, Streaming, etc...",
  grantAccess: function (user, guild) {
    return addRole("Creative", user, guild);
  }
}, {
  name: "alliance-supply",
  roleName: "alliance-supply",
  protected: 1,
  description: "Coordination about keeping our supplies up to standard. Alliance Members Only.",
  grantAccess: function (user, guild) {
    return addRole("alliance-supply", user, guild);
  }
}, {
  name: "pve",
  roleName: "PvE",
  protected: 1,
  description: "PvE combat",
  grantAccess: function (user, guild) {
    return addRole("PvE", user, guild);
  }
}, {
  name: "null-sec",
  roleName: "null-sec",
  protected: 1,
  description: "Null ops",
  grantAccess: function (user, guild) {
    return addRole("null-sec", user, guild);
  }
}, {
  name: "nsfw-nothing-to-see-here",
  roleName: "ntsh",
  protected: 1,
  description: "An Adult Channel for Adult Conversations.",
  grantAccess: function (user, guild) {
    return addRole("ntsh", user, guild);
  }
}];

roleBasedChannels.forEach(function (channel) {
  channel.grantAccess = function (user, guild) {
    return user.addRole(guild.roles.find("name", channel.roleName));
  };

  channel.revokeAccess = function (user, guild) {
    if (user.roles.exists("name", channel.roleName)) {
      return user.removeRole(guild.roles.find("name", channel.roleName));
    } else {
      return Promise.resolve();
    }
  }
});

module.exports = roleBasedChannels;
