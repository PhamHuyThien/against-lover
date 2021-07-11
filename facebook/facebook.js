const fs = require("fs");
const request = require("request");
const lib = require("./lib");

const sendMessage = (cookie, uid, fb_dtsg, uid_receiver, text, callback = (result = false) => {}) => {
    lib.log(`facebook->sendMessage: [${uid}] -> [${uid_receiver}] (${text}) starting ...`);
    request({
        url: "https://m.facebook.com/messages/send/?icm=1&refid=12",
        headers: {
            "content-type": "application/x-www-form-urlencoded",
            cookie: cookie,
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.72 Safari/537.36"
        },
        form: {
            tids: `cid.c.${uid}:${uid_receiver}`,
            [`ids%5B${uid_receiver}%5D`]: uid_receiver,
            action_time: lib.getTime(),
            fb_dtsg: fb_dtsg,
            __user: uid,
            body: text
        },
        method: "POST"
    }, (error, response, body) => {
        lib.log(`facebook->sendMessage: [${uid}] -> [${uid_receiver}] (${!error?"done":"fail"}).`);
        callback(!error);
    });
}

const getMessage = (cookie, uid, fb_dtsg, uid_receiver, timestamp = -1, limit = 50, callback = (list_messengers = {}) => {}) => {
    lib.log(`facebook->getMessage: [${uid}] -> [${uid_receiver}] (get ${limit} messager) starting ...`);
    timestamp = timestamp == -1 ? lib.getTime() : timestamp;
    let json = `{"o0":{"doc_id":"2841224182646081","query_params":{"id":"${uid_receiver}","message_limit":${limit},"load_messages":true,"load_read_receipts":true,"load_delivery_receipts":true,"before":${timestamp},"is_work_teamwork_not_putting_muted_in_unreads":false}}}`;
    request({
        url: "https://www.facebook.com/api/graphqlbatch/",
        headers: {
            "content-type": "application/x-www-form-urlencoded",
            cookie: cookie,
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.72 Safari/537.36"
        },
        form: {
            "batch_name": "MessengerGraphQLThreadFetcher",
            "__user": uid,
            "fb_dtsg": fb_dtsg,
            "queries": json
        },
        method: "POST"
    }, (error, response, body) => {
        let list_messengers = [];
        try {
            body = body.replace('{"successful_results":1,"error_results":0,"skipped_results":0}', "");
            let json_messenger = JSON.parse(body);
            let json_nodes = json_messenger.o0.data.message_thread.messages.nodes;
            for (let i = 0; i < json_nodes.length; i++) {
                let id_messenger = json_nodes[i].message_id;
                let uid_sender = json_nodes[i].message_sender.id;
                let time = json_nodes[i].timestamp_precise;
                if (uid_sender == uid_receiver && typeof json_nodes[i].message !== "undefined") {
                    let messenger = {};
                    messenger.id_messenger = id_messenger;
                    messenger.time = time;
                    if (json_nodes[i].extensible_attachment != null) {
                        messenger.is_remove = true;
                        messenger.time_remove = json_nodes[i].unsent_timestamp_precise;
                    } else {
                        messenger.text = json_nodes[i].message.text == "" ? "<Nhãn dán>" : json_nodes[i].message.text;
                    }
                    list_messengers.push(messenger);
                }
            }
        } catch (e) {
            lib.err(`facebook->getMessage: [${uid}] -> [${uid_receiver}] (${e.toString()})...`);
        }
        lib.log(`facebook->getMessage: [${uid}] -> [${uid_receiver}] finish.`);
        callback(list_messengers);
    });
}

const facebook = {
    config: null,
    loadConfig: function() {
        try {
            this.config = JSON.parse(fs.readFileSync("./config/config.json"));
        } catch (e) {
            lib.err(`facebook->loadConfig: (${e.toString()}).`);
            this.config = null;
        }
    },
    loadOldMess: function(uid_follow = 0) {
        try {
            let path = `./log/${uid_follow}/message.json`;
            return JSON.parse(fs.readFileSync(path));
        } catch (e) {
            lib.err(`facebook->loadOldMess: (${e.toString()}).`);
            return false;
        }
    },
    updateOldMess: function(uid_follow = 0, list_messengers = {}) {
        let path = `./log`;
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
        path = `${path}/${uid_follow}`;
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
        path += "/message.json";
        if (!fs.existsSync(path)) {
            fs.appendFileSync(path, "");
        }
        return fs.writeFileSync(path, JSON.stringify(list_messengers));
    },
    loadNewMess: function(uid_follow = 0, callback = function(list_messengers = {}) {}) {
        getMessage(
            this.config.cookie,
            this.config.uid,
            this.config.fb_dtsg,
            uid_follow, -1,
            lib.randomBetween(this.config.size_get_message, this.config.size_message_between),
            callback
        );
    },
    findMessage: function(messenger_id, list_messengers) {
        for (let i = 0; i < list_messengers.length; i++) {
            if (messenger_id == list_messengers[i].id_messenger) {
                return list_messengers[i];
            }
        }
        return false;
    },
    sendMessage: function(uid_follow = 0, text = "", callback = (error) => {}) {
        sendMessage(
            this.config.cookie,
            this.config.uid,
            this.config.fb_dtsg,
            uid_follow,
            text,
            callback
        );
    }
}

module.exports = facebook;