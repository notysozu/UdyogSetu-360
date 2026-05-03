class BaseNotificationProvider {
  constructor(name) {
    this.name = name;
  }

  async initialise() {
    return { ok: true };
  }

  async healthCheck() {
    return { ok: true, provider: this.name };
  }
}

module.exports = BaseNotificationProvider;
