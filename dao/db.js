const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '!QAZ@WSX3edc4rfv',
  database: 'chatDB'
});

module.exports = {
    //실행
    execute: async function(sql) {
      try {
        if(sql.indexOf(';') > -1){
            throw 'Injection Attack';
        }

        const con = await pool.getConnection().catch(err => {
          throw err;
        });

        try {
          const [rows] = await con.query(sql).catch(err => {
            throw err;
          });
          return rows;
        } catch(err2) {
          console.log('Query Error : ' + err2);
        } finally {
          con.release();
        }
      } catch(err) {
        console.log('Connection Error : ' + err);
        throw new Error('DB ERROR');
      }
    },
    
    //트랜잭션
    tran: async function(fn) {
      try {
        const con = await pool.getConnection(conn => conn).catch(err=> {
          throw err;
        });
        await con.beginTransaction();
        try {
          await fn(con).catch(err => {
            console.log('err : ' + err);
            throw err;
          });
          console.log('commit');
          con.commit();
          con.release();
          
        } catch(err2) {
          await con.rollback(); // ROLLBACK
          con.release();
        } 
      } catch(err) {
        console.log('DB Error : ' + err);
        return false;
      }
    }
}