// Copyright (C) <2019> Intel Corporation
//
// SPDX-License-Identifier: Apache-2.0

'use strict';

const redis = require('redis')
const bluebird = require('bluebird')

// Using promises
bluebird.promisifyAll(redis)

var Redis = function(onSubMessage) {
  var that = {},
    redisClient = createClient(),
    pubClient = createClient(),
    subClient = createClient();

  that.addItem = (key, id, data) => {
    return new Promise((resolve, reject) => {
      redisClient.hsetAsync(key, id, JSON.stringify(data))
                .then(
                    () => resolve('ok'),
                    err => reject(err)
                )
    }
  };

  that.delItem = (key, id, data) => {
    return new Promise((resolve, reject) => {
      redisClient.hdelAsync(key, id)
                .then(
                    res => resolve(res),
                    err => reject(err)
                )
    }
  };

  that.getItem = (key, id) => {
    return new Promise((resolve, reject) => {
      redisClient.hgetAsync(key, id)
                .then(user => {
                  resolve(JSON.parse(user));
              }, error => {
                  console.log('getUser ', error);
                  reject(error);
              })
  };

  that.getItems = (key) => {
    return new Promise((resolve, reject) => {
      redisClient.hgetallAsync(key)
                .then(users => {
                  const userList = {}
                  for (let user in users) {
                    var item = JSON.parse(users[user]);
                    userList[user] = item;
                  }
                  resolve(userList);
              }, error => {
                  console.log('getUsers ', error);
                  reject(error);
              })
  };

  that.subscribeChannel = (channel) => {
    subClient.subscribe(channel, function(e) {
      console.log("Subscribed channel:", channel, " with:", e);
    });
  }

  that.publishMsg = (channel, type, module, data) => {
    var message = {
      type: type,
      module: module,
      data: data
    };
    pubClient.publish(channel, JSON.stringify(message), function(e) {
      console.log("Published message:", message, " to channel:", channel, " with e:", e);
    });

  }

  subClient.on("message", function (channel, message) {
    onSubMessage(channel, message);
  };

  return that;
};


module.exports = Redis;

