const fs = require("fs");

const lib = {
    parseStrTime: function(nTime = -1) {
        let d = new Date();
        nTime = nTime == -1 ? d.getTime() : nTime;
        d.setTime(nTime);
        return `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()} - ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    },
    randomBetween: function(nNum, nSize = 20) {
        return this.random(nNum - nSize, nNum + nSize);
    },
    random: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    getTime: function() {
        return new Date().getTime();
    },
    log: function(text) {
        console.warn(text.replace(/\n|\r|\n\r|\r\n|\t/g, " "));
    },
    err: function(text) {
        console.error(text.replace(/\n|\r|\n\r|\r\n|\t/g, " "));
    },
    show: function(text) {
        this.log(text);
    }
}

module.exports = lib;