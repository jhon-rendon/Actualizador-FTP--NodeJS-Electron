let mysql  = require('mysql');
const { data_conection } = require(__dirname+'/config.json');

let connection = null;

const dbConnection = async() => { 
     connection =  mysql.createConnection({
        host:  data_conection.host,
        user:  data_conection.user,
        password:  data_conection.password,
        database: data_conection.database
    });


  connection.connect(function(err) {
        if (err) {
            //console.error('error connecting: ' + err.stack);
            console.log("Error al establecer la conexión a la BD -- " + err.stack); 
            throw err;
            return;
        }
        console.log("Conexión exitosa a la base de datos"); 

    });

    return connection;
}


 //Cerrar la conexión
 const closeConnection = async() => { 
  await connection.end(function(){
      // La conexión se ha cerrado
      console.log("La conexión se ha cerrado");
  });
}



  
 const getPuntos = async () => {
    
   //await dbConnection();
    return new Promise((resolve, reject)=>{
      
      connection.query('SELECT * FROM  puntos order by  zona,nombre ',  (error, rows)=>{
          if(error){
              return reject(error);
          }
          console.log('Listado Puntos de venta - Cantidad '+rows.length);
          return resolve(rows);
        
      });
      //closeConnection();
  });
  };

  const getCategorias = async () => {
    return new Promise((resolve, reject)=>{
      connection.query('SELECT * FROM tipo_actualizacion GROUP BY categoria order by categoria ',  (error, rows)=>{
          if(error){
              return reject(error);
          }
          console.log('Listado Categorias - Cantidad '+rows.length);
          return resolve(rows);
      });
  });
  };

  const getUltimoIDRegistroByIP = async ( ip ) => {
    return new Promise((resolve, reject)=>{
      connection.query("SELECT max(ID) id FROM registro WHERE PUNTOS_IP = '"+ip+"'",  (error, rows)=>{
          if(error){
              return reject(error);
          }
          console.log('Ultimo ID ('+rows[0]['id']+') registrado con la IP  '+ip);
          return resolve(rows);
      });
  });
  };


  const insertRegistro = async ( ip, categoria,horaInicio,rutaDestino,tamanioArchivo,observacion ) => {
    return new Promise((resolve, reject)=>{
      let sql = "INSERT INTO actualizador.registro (PUNTOS_IP, TIPO_ACTUALIZACION_ID, FECHA,HORA_INICIO, ESTADO,RUTA,TAMANIO_TOTAL ,OBSERVACION) VALUES ('"+ip+"', '"+categoria+"', NOW(), '"+horaInicio+"', 'Procesando','"+rutaDestino+"','"+tamanioArchivo+"','"+observacion+"')";
      connection.query(sql,  (error, rows)=>{
          if(error){
              return reject(error);
          }
          console.log("Registro Satisfactorio");
          return resolve(true);
      });
  });
  };

  const updateRegistro = async ( id, ip ,horaFinal,estado,tamanioParcial,porcentaje,error='' ) => {
    return new Promise((resolve, reject)=>{
     let sql = `UPDATE actualizador.registro 
                SET HORA_FIN = '${horaFinal}',estado='${estado}',error='${error}',TAMANIO_PARCIAL='${tamanioParcial}',
                    PORCENTAJE = '${porcentaje}'
               WHERE PUNTOS_IP = '${ip}' AND id ='${id}'`;
      connection.query(sql,  (error, rows)=>{
          if(error){
              return reject(error);
          }
          console.log("Actualización Satisfactoria");
          return resolve(true);
      });
  });
  };



 


  dbConnection();


  module.exports = {
   getPuntos,
   getCategorias,
   getUltimoIDRegistroByIP,
   insertRegistro,
   updateRegistro
 } 