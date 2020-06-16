Module.register("MMM-HomeAssistant", {
  defaults: {
    host: "",
    port: 8123,
    accessToken: "",
    updateInterval: 5*1000,
  },

  getStyles: function() {
    return ["MMM-HomeAssistant.css"];
  },

  start: function() {
    console.log("Starting module: " + this.name);

    this.url = "http://" + this.config.host + ":" + this.config.port.toString();
    this.equipData = null;
    this.loaded = false;
    this.stateTimer = setInterval(() => {
      this.getStates();
    }, this.config.updateInterval);
    this.getStates();
  },

  getStates: function() {
    this.sendSocketNotification('HA_GET_STATES', {
        baseUrl: this.url,
        accessToken: this.config.accessToken,
      });
  },

  socketNotificationReceived: function(notification, payload) {
    switch (notification) {
      case "HA_GET_STATES_RET":
        this.processStates(payload);
        this.updateDom();
        break;
      case "HA_POST_STATE_RET":
        break;
      default:
        break;
    }
  },

  processStates: function(data) {
    this.loaded = true;
    this.equipData = data;
  },

  getDom: function() {
    if (this.suspended == true) {
      return document.createElement("div");
    }
    if (!this.loaded) {
      var loading = document.createElement("div");
      loading.innerHTML = "Loading Home Assistant...";
      loading.className = "normal regular medium";
      return loading;
    }

    var wrapper = document.createElement("div");
    wrapper.className = "wrapper"

    for (let equip of this.equipData) {
      if (equip.entity_id.startsWith("light.")) {
        console.log(this.name + " get equipment:" + equip.attributes.friendly_name + ", id: ", equip.entity_id);
        var group = this.makeLightGroup(equip.entity_id, equip.attributes.friendly_name, equip.state);
        wrapper.appendChild(group);
      }
    }

    return wrapper;
  },

  postState: function(entityId, equipType, state) {
    this.sendSocketNotification('HA_POST_STATE', {
        baseUrl: this.url,
        accessToken: this.config.accessToken,
        entityId: entityId,
        equipType: equipType,
        state: state
      });
  },

  makeLightGroup: function(entityId, name, state) {
    return this.makeLightSwitchGroup(entityId, name, state, "light");
  },

  makeLightSwitchGroup: function(entityId, name, state, type) {
    var self = this;
    var group = document.createElement("div");
    group.className = "group"

    var input = document.createElement("input");
    input.id = "cb";
    input.setAttribute("type", "range");

    if (state == "on") {
      input.value = 100;
    }
    else {
      input.value = 0;
    }

    input.addEventListener('input', function() {
      self.postState(entityId, type, input.value);
    });

    input.className = "slider"

    group.appendChild(input);

    var text = document.createElement("div");
    text.className = "text";
    text.innerText = name;
    group.appendChild(text);

    var button = document.createElement("label");
    button.className = "switch";

    group.appendChild(button);

    return group;
  },
});
