/*******************************************************************************
 * Copyright (c) 18-dec-2013 University of Bologna
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * and Eclipse Distribution License v1.0 which accompany this distribution.
 *
 * The Eclipse Public License is available at 
 *    http://www.eclipse.org/legal/epl-v10.html
 * and the Eclipse Distribution License is available at 
 *   http://www.eclipse.org/org/documents/edl-v10.php.
 *
 * Contributors:
 *    Matteo Collina - initial API and implementation and/or initial documentation
 *******************************************************************************/

var mqtt = require("mqtt")
  , total = 500
  , received = 0
  , print = function(text) {
              process.stdout.write(text + "\n");
            }
  , listener = mqtt.createClient()
  , publishers = []
  , start = null
  , connected = 0 
  , publish = function() {
                  var i
                  connected++;
                  //print("connected " + connected);
                  if (connected === total) {
                    //print("publishing");
                    console.error("all client connected, sending the message");
                    start = Date.now();
                    
                    for (i = 0; i < publishers.length; i++)
                      publishers[i].publish({ topic: "/hello", payload: "world", qos: 1, messageId: 42, retain: false })
                  }
                }
  , i = 0
  , created = function(err, conn) {
                if (err) {
                  console.error(err);
                  setTimeout(next, 1000);
                  return;
                }

                publishers.push(conn);

                if (publishers.length % (total / 10) === 0) {
                  console.error("publishers " + publishers.length);
                }

                conn.on("connack", publish);
                conn.on("connack", next);
                conn.on("puback", function() {
                  connected--;
                  this.stream.end()
                });

                conn.connect({
                  protocolId: 'MQIsdp',
                  protocolVersion: 3,
                  clientId: "client" + publishers.length,
                  keepalive: 1000,
                  clean: true
                });
              }
  , next = function() {
             if (publishers.length < total) {
               mqtt.createConnection(1883, '127.0.0.1', created);
             }
           };

listener.subscribe("/hello", next);
listener.on("message", function() {
  var time = Date.now() - start;

  received++
  print(received + "," + time);

  if (received === total) {
    console.error("done");
    listener.end();
  }
})
