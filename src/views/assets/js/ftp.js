let mysql = require('mysql');

const fs = require("fs");
const {NodeSSH} = require('node-ssh')
let $ = require( "jquery" );
let ping = require('ping');

// Add the credentials to access your database
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : null, // or the original password : 'apaswword'
    database : 'actualizador'
});

// conectarse a mysql
connection.connect((err) => {
    if (err) {
        console.log("Error al establecer la conexión a la BD -- " + err); 
        throw err;
    } else {
        console.log("Conexión exitosa a la base de datos"); 
    }
});
//connection.end();

// Realizar una consulta


const categoria = async () => {
    $query = 'SELECT * FROM tipo_actualizacion GROUP BY categoria order by categoria';
    connection.query($query, function(err, rows, fields) {
    if(err){
        console.log("An error ocurred performing the query.");
        console.log(err);
        return;
    }

    console.log("Listado Categoria", rows);
    for ( let i=0; i<rows.length;i++){
        $("#categoria").append("<option value='"+rows[i]['ID']+"'>"+rows[i]['CATEGORIA']+"</option>");
    }
    
    });
}



const obtenerUltimoIDRegistroByIP = async ( ip ) => {
    
    let result = null;
    let sql  = "SELECT max(ID) id FROM registro WHERE PUNTOS_IP = '"+ip+"'";
    //console.log(sql);
    await connection.query(sql, function(err, rows, fields) {
    if(err){
        console.log("An error ocurred performing the query.");
        console.log(err);
        return;
    }

    //console.log("Obteniendo ultimo registro con la ip ", ip);
    //console.log(rows[0]['id']);
    result = rows[0]['id'];
    console.log("result "+result);
    return result;
    });

    return result;
   
}


const insert = async( ip,categoria,horaInicio) =>{

   
    let sql = "INSERT INTO actualizador.registro (PUNTOS_IP, TIPO_ACTUALIZACION_ID, FECHA,HORA_INICIO, ESTADO,RUTA,TAMANIO,OBSERVACION) VALUES ('"+ip+"', '"+categoria+"', NOW(), '"+horaInicio+"', 'En Progreso','"+rutaDestino+"','"+tamanioArchivo+"','"+observacion+"')";
    console.log('Insertando '+sql);
     connection.query(sql, function(err, rows, fields) {
    if(err){
        console.log("An error ocurred performing the query.");
        console.log(err);
        return;
    }else{
        console.log('Insert ok');
    }
    });
}


const update = async( ip,horaFinal) =>{

   
    let sql = "UPDATE actualizador.registro SET HORA_FIN = '"+horaFinal+"',estado='FINALIZADO' WHERE PUNTOS_IP = '"+ip+"'";

    console.log('update '+sql);
     await connection.query(sql, function(err, rows, fields) {
    if(err){
        console.log("An error ocurred performing the query.");
        console.log(err);
        return;
    }else{
        console.log('Insert ok');
    }
    });
}

categoria();

const table = async ()=>{ 
    
    $query = 'SELECT * FROM  puntos ';
    connection.query($query, function(err, rows, fields) {
    if(err){
        console.log("An error ocurred performing the query.");
        console.log(err);
        return;
    }

    console.log("Query succesfully executed", rows);

    let listado = document.getElementById("listadoPDV");

    
  
     
     let res = null;
     let msg = "";
  
   
   
      // crea un nuevo objeto `Date`
  var today = new Date();
   
  // obtener la hora en la configuración regional de EE. UU.
  var now = today.toLocaleTimeString('en-US');
  //console.log(now);
  //console.log(rows.length);

  let countRegistros = rows.length;
  let porcentaje = 0; 
  let carga = 0;
    for ( let i=0; i<rows.length;i++){
  
      let dirIp = $.trim( rows[i]['IP']);
      
       ping.sys.probe(dirIp, function(isAlive){
           res = isAlive ? 'ON '+rows[i]['NOMBRE']: 'OFF '+rows[i]['NOMBRE'];
           msg = isAlive ? ' <div class="btn btn-success estado">ON</div>':'  <div class="btn btn-danger">OFF</div>'
           //console.log(res);
       let disabled ="";
        if( !isAlive ){
            disabled = "disabled";
        }   
  
       listado.innerHTML+=` <tr>
                              <td class='estado'>${msg}</td>
                              <td class='dirIP'>${dirIp}</td>
                              <td>${rows[i]['ZONA']}</td> 
                              <td>${rows[i]['NOMBRE']}</td> 
                              <td class='horaInicio'></td>
                              <td class='horaFinal'></td>
                              <td> <button class='btn btn-info btnFtp' data-ip='${dirIp}' data-pdv='${rows[i]['NOMBRE']}' ${disabled} ' onclick='enviarFTP(event)'> Ejecutar </button>
                              <!--<div class='progress'>
                              <div class='progress-bar'  role='progressbar' style='width:0%;' aria-valuenow='0' aria-valuemin='0' aria-valuemax='100'>0%</div>
                              </div>-->
                              </td>
                              <td>
                              <div class='progress'>
                              <div class='progress-bar'  role='progressbar' style='width:0%;' aria-valuenow='0' aria-valuemin='0' aria-valuemax='100'>0%</div>
                              </div>
                              </td>
                            
                            </tr>`;

                            carga++;
                            porcentaje = (( carga / countRegistros )*100).toFixed(0);
                            console.log('carga',carga);
                            $("#cargaPuntos").width(porcentaje+'%');
                             $("#cargaPuntos").text(porcentaje+"%");

                            
     });
    
  }
  
  


});

}
table();



  let rutaOrigen  = "";
  let rutaDestino = "";
  let tamanioArchivo = null;
  let observacion = null;
  let categoriaArchivo = null;

  $("#rutaOrigen").change(function(e){
    rutaOrigen  = $.trim( document.getElementById("rutaOrigen").files[0].path );
    rutaOrigen = String(rutaOrigen).replace(/\\/g, "/");
    
    let arrRutaOrigen = rutaOrigen.split('/');
    $("#rutaDestino").val('/home/gamble/prueba-ftp/'+arrRutaOrigen[ (arrRutaOrigen.length -1)]);

    const fs = require('fs');
    const {size} = fs.statSync(rutaOrigen);
    console.log("Bytes:"+size);
    console.log("Mega:"+(size/1048576).toFixed(2) );
    tamanioArchivo = (size/1048576).toFixed(2);
    

  });

 

    const enviarFTP = async (e) => {
        //console.log('enviarFTP()'+e.target);

        let ultimoID = await obtenerUltimoIDRegistroByIP('192.168.41.13');
        
        console.log('ULtimo ID '+ultimoID);
       
        return;

       

        let obj = e.target;

        console.log('clcik');
        $(obj).attr('disabled', true);
    // crea un nuevo objeto `Date`
    let horaInicio = new Date().toLocaleTimeString('en-US');
 
    
        const ipPDV = $.trim( $(obj).data("ip") );
        const pdv = $.trim( $(obj).data("pdv") );
        let msg = $("#msg");
        let comando = $("#comando");
        

        console.log(ipPDV);
        
        
        categoriaArchivo = $("#categoria option:selected").val();
        //msg.hide();
        /*if( document.getElementById("rutaOrigen").files[0] ){
        rutaOrigen  = $.trim( document.getElementById("rutaOrigen").files[0].path );
        }*/
        rutaDestino = $.trim( $("#rutaDestino").val() );

        //rutaOrigen  = "C:/Users/Jhon Rendon/Downloads/Reporte_Alertas_14-03-2023.xlsx";
        //rutaDestino = "/home/gamble/prueba-ftp/";
        //rutaOrigen = String(rutaOrigen).replace(/\\/g, "/");


        observacion = $.trim( $("#observacion").val() );
        console.log("observacion"+observacion);
        

        console.log('Boton IP '+ipPDV);
        console.log('RUta origen ',rutaOrigen);
        //console.log('RUta origen ',rutaDestino);

        if( rutaDestino !="" && rutaOrigen!=""){
            $(obj).attr('disabled', true);
        const ssh = new NodeSSH();
        let porcentaje = 0;
        ssh.connect({
            host: ipPDV,
            username: 'gamble',
            password: 'gamble',
            port: 22
          })
          .then(function() {
            $(obj).attr('disabled', true);
            $(obj).parent().parent().find('td.horaInicio').text(horaInicio);

            insert( ipPDV,categoriaArchivo,horaInicio);

            ssh.putFile(rutaOrigen, rutaDestino, undefined, {
                step: (total_transferred, chunk, total) => {
                    //console.log('Uploaded', total_transferred, 'of', total);
                    // obj.parent().next().find(".progress-bar")
                    
                    porcentaje = ( (total_transferred/total)*100 ).toFixed(0);
                    //console.log("%"+porcentaje);
                    if( porcentaje <=100){
                        $(obj).parent().next().find(".progress-bar").width(porcentaje+'%');
                        $(obj).parent().next().find(".progress-bar").text(porcentaje+"%");
                    }
                }
            }).then(data => {
              // success
              console.log("Archivo Cargado Satisfactoriamente en el punto de venta "+pdv+" con IP "+ipPDV);
              msg.append(""+pdv+" con IP "+ipPDV+" <br>");
              msg.show();
              $(obj).attr('disabled', false);
             let horaFinal = new Date().toLocaleTimeString('en-US');
 
  
             $(obj).parent().parent().find('td.horaFinal').text(horaFinal);

             update( ipPDV,horaFinal);
             $(obj).attr('disabled', false);
              //console.log(now);
            }).catch(error => {
              // error
              console.log(error);
              $(obj).attr('disabled', false);
            })

            $(obj).attr('disabled', false);
            // Local, Remote
            /*ssh.putFile(rutaOrigen, rutaDestino).then(function() {
              console.log("Archivo Cargado Satisfactoriamente en el punto de venta "+pdv+" con IP "+ipPDV);
              msg.append("Archivo Cargado Satisfactoriamente en el punto de venta "+pdv+" con IP "+ipPDV+" <br>");
              msg.show();

              if( $.trim( comando.val() ) !=""){
              ssh.execCommand( $.trim( comando.val() ), { cwd:'/home/gamble/' }).then(function(result) {
                console.log('STDOUT: ' + result.stdout)
                console.log('STDERR: ' + result.stderr)
              });
              }
              
            }, function(error) {
              console.log("Error al cargar el archivo");
              console.log(error);
              msg.append("Error al cargar el archivo " +error);
              msg.show();
         })*/
        });

        

        }else{
            alert('Especifique la ruta de origen y destino');
        }
/*
        const config = {
            host: ipPDV,
            port: '22',
            username: 'gamble',
            password: 'gamble'
          };
          
          //C:\Users\Jhon Rendon\Desktop\Nueva carpeta (2)\FTP-BALOTO\archivo
          let data = fs.createReadStream('C:/Users/Jhon Rendon/Desktop/Nueva carpeta (2)/FTP-BALOTO/archivo/app.js');
          //let data = fs.createReadStream('C:/Users/Jhon Rendon/Desktop/Nueva carpeta (2)/FTP-BALOTO/archivo/businessnet.zip');
          let remote = '/home/gamble/Alarma/app.js';
          //let remote = '/home/gamble/prueba/businessnet.zip';
          
          let sftp = new Client;
          
          sftp.connect(config)
          
          .then(() => {
            return sftp.put(data, remote);
            })
            .then(() => {
              console.log("IP :"+ip[i]['ESTAIPPU']," pds:"+ip[i]['ESTANOMB'])
              //return sftp.list('/home/gamble/Alarma');
            })
            .then(data => {
              //console.log(data);
            })
            .then(() => {
              sftp.end();
            })
            .catch(err => {
              //console.error(err.message);
              console.log(" ERROR IP :"+ip[i]['ESTAIPPU']," pds:"+ip[i]['ESTANOMB'])
            });
         */ 
         $(obj).attr('disabled',false);
    }



// Cerrar la conexión
/*connection.end(function(){
    // La conexión se ha cerrado
});*/


function validPing(){

    console.log('validPing ');
    let dirIp = null;

    $("#listadoPDV > tr").each(function( index, tr ){
             //console.log(tr);
             //$(tr).
             dirIp = $.trim( $(tr).find('td.dirIP').text() );

             ping.sys.probe(dirIp, function(isAlive){
                estado = isAlive ? ' <div class="btn btn-success estado">ON</div>':'  <div class="btn btn-danger">OFF</div>'
                //console.log(res);
            let disabled = false;
             if( !isAlive ){
                 disabled = true;
             }  

           
             $(tr).find('td.estado').html(estado);
             $(tr).find('td').children('.btnFtp').attr('disabled',disabled);
             //console.log(dirIp+" "+estado);
    });

    });
}



const intervalID = setInterval (() => {

    validPing();
},1000);
//60000



