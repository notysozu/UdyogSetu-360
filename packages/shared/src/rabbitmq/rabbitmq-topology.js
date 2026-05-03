const { QueueTopologyError } = require('../errors/queue-errors');
const { RABBITMQ_TOPOLOGY } = require('../constants/rabbitmq.constants');

async function assertExchanges(channel) {
  for (const exchange of RABBITMQ_TOPOLOGY.exchanges) {
    await channel.assertExchange(exchange.name, exchange.type, exchange.options);
  }
}

async function assertQueues(channel, config = {}) {
  const asserted = [];
  for (const queue of RABBITMQ_TOPOLOGY.buildQueues(config)) {
    asserted.push(await channel.assertQueue(queue.name, queue.options));
  }
  return asserted;
}

async function bindQueues(channel) {
  for (const binding of RABBITMQ_TOPOLOGY.bindings) {
    await channel.bindQueue(binding.queue, binding.exchange, binding.routingKey);
  }
}

async function assertRabbitTopology(channel, config = {}) {
  if (!channel) {
    throw new QueueTopologyError('A RabbitMQ channel is required to assert topology.');
  }

  await assertExchanges(channel);
  await assertQueues(channel, config);
  await bindQueues(channel);
  return true;
}

module.exports = {
  assertExchanges,
  assertQueues,
  bindQueues,
  assertRabbitTopology
};
