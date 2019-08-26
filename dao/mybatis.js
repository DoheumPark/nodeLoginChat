const db = require('./db');
const mybatisMapper = require('mybatis-mapper');

mybatisMapper.createMapper(__dirname, [ 'user.xml' ]);

const format = {language: 'sql', indent: '  '};
module.exports = {
    query : async function(namespace, sqlId, param = {}) {
        var sql = mybatisMapper.getStatement(namespace, sqlId, param, format);
        return await db.execute(sql).catch((err) => {
            console.log('err : ' + err);
        });
    }
}