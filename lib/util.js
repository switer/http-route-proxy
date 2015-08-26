var util = {
    copy: function (obj) {
        return JSON.parse(JSON.stringify(obj));
    }
}

module.exports = util;