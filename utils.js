const final = require('./final')

module.exports = {
    //로그인 사용자가 마지막 요청 시간이 현재시간으로부터 15분이 지났는지 체크 (true: 지났음, false: 안 지났음)
    isFinishLogin: function(use_datetime) {
        const useDatetime = new Date(use_datetime) //마지막 사용시간
        const now = new Date(); //현재시간
        const gap = now.getTime() - useDatetime.getTime()

        if(gap > final.LOGIN_TIME_LIMITE) { //마지막 사용 후 15분 경과
            return true;
        }
        return false;
    }
}