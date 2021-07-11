const facebook = require("./facebook/facebook");
const lib = require("./facebook/lib");

/*
    Script:             against-love
    Version:            1.0.0
    Author:             PhamHuyThien
    Contact:            https://fb.com/ThienDz.SystemError
*/
var count = 0;
facebook.loadConfig();
(function againstLover(index) {
    if (index >= facebook.config.uid_follow.length) {
        index = 0;
    }
    let person_follow = facebook.config.uid_follow[index];
    //==============================================
    lib.show(`Bắt đầu check tin nhắn [${person_follow.uid}] ${person_follow.name} ...`);
    //==============================================
    facebook.loadNewMess(person_follow.uid, function(list_messengers) {
        if (list_messengers.length > 0) {
            let list_messengers_old = facebook.loadOldMess(person_follow.uid);
            if (list_messengers_old !== false) {
                let text = "";
                for (let i = 0; i < list_messengers.length; i++) {
                    let messenger = facebook.findMessage(list_messengers[i].id_messenger, list_messengers_old);
                    if (
                        typeof list_messengers[i].is_remove != "undefined" &&
                        messenger !== false &&
                        typeof messenger.is_remove == "undefined"
                    ) {
                        let text_config = facebook.config.text_reply;
                        text_config = text_config.replace(/(\[name\])/g, facebook.config.name);
                        text_config = text_config.replace(/(\[time\])/g, lib.parseStrTime());
                        text_config = text_config.replace(/(\[_name\])/g, person_follow.name);
                        text_config = text_config.replace(/(\[_text\])/g, messenger.text);
                        text_config = text_config.replace(/(\[_time\])/g, lib.parseStrTime(messenger.time_remove));
                        text += text_config + "\n";
                    }
                }
                if (text != "") {
                    facebook.sendMessage(person_follow.uid, text, function(error) {
                        //==============================================
                        lib.show(`Gửi tin nhắn [${person_follow.uid}] ${person_follow.name} ${error ? "thành công" : "thất bại"}!`);
                        //==============================================
                    });
                }
            }
            facebook.updateOldMess(person_follow.uid, list_messengers);
        }

        let time_sleep = lib.randomBetween(++count % facebook.config.count_sleep == 0 ? facebook.config.time_sleep : facebook.config.time_refresh, facebook.config.time_step);
        setTimeout(() => againstLover(index + 1), time_sleep);
        //==============================================
        lib.show(`[${person_follow.uid}] ${person_follow.name} chờ ${time_sleep}ms đến người tiếp theo...`);
        //==============================================
    });
})(0);

/*
- Cách cài đặt
    + Tải NodeJS
    + Truy cập vào file ./config/config.json
        + Sửa lại cookie, fb_dtsg, uid, name... thành nick của bạn (cách lấy có thể tham khảo google).
        + time_refresh là thời gian check lại tin nhắn mỗi x milisecond.
        + size_get_message là số lượng tin nhắn sẽ lấy mỗi lần quét (time_refresh càng dài thì càng lên lấy nhiều tin nhắn).
        + text_reply chính là nội dung bạn muốn rep (có thể chèn pattern bên dưới cho sinh động).
        + uid_follow chính là những người bạn muốn theo dõi (ny chẳng hạn).
    + mở CommandPrompt lên gõ lệnh node index.js
    + Bùm giờ cho người ấy gỡ tẹt ga hí hí

- Nội dung tin nhắn trong config.json có thể dùng các pattern dưới đây cho linh động:
    + [name]=tên mình.
    + [time]=thời gian hiện tại.
    + [_name]=tên đối phương.
    + [_text]=nội dung đối phương đã gỡ.
    + [_time]=thời gian đối phương đã gỡ.
*/