const fs            = require("fs");
const { NodeSSH }   = require('node-ssh')
let $               = require( "jquery" );
let ping            = require('ping');
require( 'datatables.net' )( window, $ );

const { getPuntos,getCategorias,
        getUltimoIDRegistroByIP,
        insertRegistro,
        updateRegistro 
      } = require(__dirname+'/assets/js/database.js');

const { data_ftp_ssh, data_rutas_app, data_vnc } = require(__dirname+'/assets/js/config.json');




const tableListarPuntos = async () => {
  let getPDV =  await getPuntos();
  
  if( getPDV.length > 0 ){

    let bodyTablePDV    = document.getElementById("listadoPDV");
    let estadoPing      = "";
    let countReg        = getPDV.length;
    let porcentaje      = 0; 
    let countCarga      = 0;
    let divProgressBar  = $("#cargaPuntos");

   for ( let i=0; i<getPDV.length;i++ ) {
 
     let dirIp  = $.trim( getPDV[i]['IP']);
     let nombre = $.trim( getPDV[i]['NOMBRE'] ); 
     let zona   = $.trim( getPDV[i]['ZONA'] ); 

     
      ping.sys.probe(dirIp, function( isAlive ){
        estadoPing = isAlive ? ' <span class="btn btn-success estado">ON</span>':'  <span class="btn btn-danger">OFF</span>'
        let disabled ="";

       if( !isAlive ){
          disabled = "disabled";
       }   
 
       bodyTablePDV.innerHTML+=` <tr>
                                    <td class='estado'>${estadoPing}</td>
                                    <td class='dirIP'>${dirIp}</td>
                                    <td class='zona'>${zona}</td> 
                                    <td>${nombre}</td> 
                                    <td class='horaInicio'></td>
                                    <td class='horaFinal'></td>
                                    <td class="btn-group" role="group">
                                    
                                      <button class='btn btn-info btnFtp' data-ip='${dirIp}' data-pdv='${nombre}' ${disabled}  onclick='enviarArchivo(event)'> Transferir </button>
                                      <button class='btnHV btn btn-warning' data-ip='${dirIp}' data-pdv='${nombre}' data-zona='${zona}' ${disabled} onclick='getHVPDV(event)'>HV</button>
                                      <button class='btn btn-danger btnCerrarPos' data-ip='${dirIp}' data-pdv='${nombre}' ${disabled} onclick='closePosslim(event)'>Pos</button>
                                      <button class='btn btnVNC' style='background:#8ED694' data-ip='${dirIp}' data-pdv='${nombre}' ${disabled} onclick='openVNC(event)'>VNC</button>
                                      <button class='btn btnPutty' style='background:#2a2828;color:white;' data-ip='${dirIp}' data-pdv='${nombre}' ${disabled} onclick='openPutty(event)'>Putty</button>
                                    
                                    
                                    <!--<button class='btn btn-dark' data-ip='${dirIp}' data-pdv='${nombre}' ${disabled} onclick='iperf3(event)'>iperf3</button>-->
                                    
                                    <!--<div class='progress'>
                                    <div class='progress-bar'  role='progressbar' style='width:0%;' aria-valuenow='0' aria-valuemin='0' aria-valuemax='100'>0%</div>
                                    </div>-->
                                    </td>
                                    <td>
                                    <div class='progress'>
                                    <div class='progress-bar'  role='progressbar' style='width:0%;' aria-valuenow='0' aria-valuemin='0' aria-valuemax='100'>0%</div>
                                    </div>
                                    <span class='reconexion' style='font-size:10px;'></span>
                                    </td>
                           
                                </tr>`;

                           countCarga++;
                           porcentaje = (( countCarga / countReg )*100).toFixed(0);
                           divProgressBar.width(porcentaje+'%');
                           divProgressBar.text(porcentaje+"%");
                           $("#cantidad").text(countCarga);
                           

                           if( divProgressBar.text() =='100%' ){
                            $("#transTodo").attr("disabled",false); //Habilitar Boton Transferir Todo
                            $("#hvTodo").attr("disabled",false); //Habilitar Boton HV Todo
                            
                            $("#tablePDV").DataTable({
                              "paging": false
                            });
                           }
            
    });//Fin PING
   
   }//fin for

   

  }//fin if

}//Fin funcion tableListarPuntos


const getListCatgorias = async () => {

  let getCat =  await getCategorias();
  
  if( getCat.length > 0 ){

    for ( let i=0; i<getCat.length;i++ ){
      $("#categoria").append("<option value='"+getCat[i]['ID']+"'>"+getCat[i]['CATEGORIA']+"</option>");
    }//fin for
  }//fin if 

};//Fin funcion getListCatgorias




let rutaOrigen = "";
$("#rutaOrigen").change(function(e){

  rutaOrigen  = $.trim( document.getElementById("rutaOrigen").files[0].path );
  rutaOrigen  = String(rutaOrigen).replace(/\\/g, "/");
  
  let arrRutaOrigen = rutaOrigen.split('/');
  $("#rutaDestino").val('/home/gamble/'+arrRutaOrigen[ (arrRutaOrigen.length -1)]);
  
});




const validPing = () => {

  console.log('validPing ');
  let dirIp      = null;
  let estadoPing = "";
  let disabled   = false;

  $("#listadoPDV > tr").each(function( index, tr ){
    dirIp = $.trim( $(tr).find('td.dirIP').text() );
    
    ping.sys.probe(dirIp, function(isAlive){
      estadoPing = isAlive ? ' <span class="btn btn-success estado">ON</span>':'  <span class="btn btn-danger">OFF</span>'
      disabled   = false;
      if( !isAlive ){
         disabled = true;
      }  
      $(tr).find('td.estado').html(estadoPing);
      $(tr).find('td').children('.btnFtp').attr('disabled',disabled);
      $(tr).find('td').children('.btnHV').attr('disabled',disabled);
      $(tr).find('td').children('.btnVNC').attr('disabled',disabled);
      $(tr).find('td').children('.btnPutty').attr('disabled',disabled);
      $(tr).find('td').children('.btnCerrarPos').attr('disabled',disabled);
                                      
       
   });

  });
}


let cantidadIntentosReconexionPermitidos = data_ftp_ssh.intentosPermitidos;

const enviarArchivo = async ( event ) => {
 
  let  obj                = event.target;
  let  horaInicio         = new Date().toLocaleTimeString();
  let  ipPDV              = $.trim( $(obj).data("ip") );
  let  nombrePDV          = $.trim( $(obj).data("pdv") );
  let  categoriaArchivo   = $("#categoria option:selected").val();
  let  rutaDestino        = $.trim( $("#rutaDestino").val() );
  let  observacion        = $.trim( $("#observacion").val() );
  let  porcentaje         = 0;
  let  totalTransferido   = 0;
  let  intentosReconexion = 1;
  let  estadoTransferencia= false;
  let  ultimoIDByIP       = null;
  let  idsetInterval      = null;
  let  insertReg          = false;

  $(obj).attr('disabled', true);
  
  
  if( rutaDestino !="" && rutaOrigen!="" ){

    /*if( !confirm("Realmente desea transferir el archivo ?") ){
      $(obj).attr('disabled', false);
      return;
    }*/
    
    $(obj).attr('disabled', true);
    const {size}       = fs.statSync(rutaOrigen);
    let tamanioArchivo = (size/1048576).toFixed(2);
       const ssh = new NodeSSH();

        const ConectarSSH = async () => {
        await ssh.connect ({
            host: ipPDV,
            username: data_ftp_ssh.user,
            password: data_ftp_ssh.password,
            port: data_ftp_ssh.port,
            readyTimeout: data_ftp_ssh.tiempoReconexion
          })
          .then( async function() {
            
            horaInicio = new Date().toLocaleTimeString();
            $(obj).attr('disabled', true);
            $(obj).parent().parent().find('td.horaInicio').text(horaInicio);
            $(obj).parent().parent().find('td.horaFinal').text("");
            $(obj).parent().next().find(".progress-bar").css('background', '#5ea0c4'); //Azul
          
            intentosReconexion = 1;
            $(obj).parent().next().find(".reconexion").html('');

            if( !insertReg ){
              if( insertRegistro( ipPDV, categoriaArchivo,horaInicio,rutaDestino,tamanioArchivo,observacion) ){
                ultimoIDByIP = await getUltimoIDRegistroByIP(ipPDV);
                ultimoIDByIP = ultimoIDByIP[0]['id'];
                insertReg = true;
              } 
            }
            console.log('Transfiriendo Archivo');    
            ssh.putFile(rutaOrigen, rutaDestino, undefined, {
                preserveTimestamps: true,
                step: (total_transferred, chunk, total) => {
                    totalTransferido = (total_transferred/1048576).toFixed(2);
                    porcentaje = ( (total_transferred/total)*100 ).toFixed(0);
                    if( porcentaje <=100){
                        $(obj).parent().next().find(".progress-bar").width(porcentaje+'%');
                        $(obj).parent().next().find(".progress-bar").text(porcentaje+"%");
                    }
                },
               
                
            }).then( async(data) => {
              // success
              let horaFinal = new Date().toLocaleTimeString();
              if( ultimoIDByIP ){
                 await updateRegistro( ultimoIDByIP, ipPDV ,horaFinal,"Finalizado",totalTransferido,porcentaje );
              }
            
              console.log("Archivo Cargado Satisfactoriamente en el punto de venta "+nombrePDV+" con IP "+ipPDV);
    
              $(obj).parent().next().find(".progress-bar").css('background', '#49af85'); //Azul
              $(obj).attr('disabled', false);
              $(obj).parent().parent().find('td.horaFinal').text(horaFinal);
              $(obj).attr('disabled', false);

              estadoTransferencia = true;
              clearInterval(idsetInterval); // Finalizar Interval

              ssh.dispose();
        
            }).catch( async(error) => {
              // error
              console.log('error al transferir');
              console.log(error);
            });
    
          $(obj).attr('disabled', false);
          //ssh.dispose();
      }).catch( (error) => {
        console.log('Error al Conectar PoR ssh EN LA ip '+ipPDV+" "+error);
      });

    }

    await ConectarSSH();
   // console.log(ssh);

      // Reintentos
      if( intentosReconexion <= cantidadIntentosReconexionPermitidos ){

        idsetInterval = setInterval(async function() {
          if( intentosReconexion <= cantidadIntentosReconexionPermitidos ){
            if (await !ssh.isConnected() ) {
              $(obj).parent().next().find(".progress-bar").css('background', '#d5d154');//Amarillo
              $(obj).parent().next().find(".reconexion").html('Intento Reconexión '+intentosReconexion);
              ConectarSSH();
              console.log('Intento de Reconexión # '+intentosReconexion);
              intentosReconexion++ ;
              
            }
          }
          else if( intentosReconexion > cantidadIntentosReconexionPermitidos &&  !estadoTransferencia ){
            //Finalizar 
            console.log("Finalizar transferencia incompleta ");
            $(obj).parent().next().find(".progress-bar").css('background', '#f7462a');//Rojo
            let horaFinal = new Date().toLocaleTimeString();
            if( ultimoIDByIP ){
                console.log("Trasnferencia Incompleta ");
                await updateRegistro( ultimoIDByIP, ipPDV ,horaFinal,"Incompleto",totalTransferido,porcentaje,"Error de conexión" );
            }
            clearInterval(idsetInterval);
            ssh.dispose();
            $(obj).attr('disabled', false);
            intentosReconexion = 1;
          }
        }, data_ftp_ssh.tiempoReconexion)
      }



  }else{
     //alert('Especifique la ruta de origen y destino');
     $("#modalBody").html("Debe Selecciconar la ruta de origen y destino");
     let myModal = new bootstrap.Modal(document.getElementById('modal'), {
       keyboard: false
     });
     myModal.show();
  }

   $(obj).attr('disabled',false);


}


let myModal = new bootstrap.Modal(document.getElementById('modal'), {
  keyboard: false
});


let dataJsonExcel = [];

const getHVPDV = async( event , tipo = null) =>{

  const ssh = new NodeSSH();

  let  obj                = (!tipo ) ? event.target : event ;
  let  ipPDV              = $.trim( $(obj).data("ip") );
  let  nombrePDV          = $.trim( $(obj).data("pdv") );
  let  zona               = $.trim( $(obj).data("zona") );

   await ssh.connect ({
      host: ipPDV,
      username: data_ftp_ssh.user,
      password: data_ftp_ssh.password,
      port: data_ftp_ssh.port,
      readyTimeout: data_ftp_ssh.tiempoReconexion
    })
    .then( async function() {

      myModal.hide();
      if( !tipo ){
        dataJsonExcel = [];
      }

      let json = {
        ip        : ipPDV,
        pdv       : nombrePDV, 
        zona,
        hostname  : null,
        so        : null,
        macBnet   : null,
        macReal   : null,
        ram       : null,
        procesador: null,
        board     : null,
        disco     : null,
        posslim   : null,
        jarPata   : null,
        jarBaloto : null,
        jarGiros  : null,
        jarGW     : null  
      };
      let  table =`<table class='table table-bordered'>
                    `;
      await  ssh.execCommand(`hostnamectl | grep "Static"`, { cwd:'./' }).then(function(result) {
        console.log('STDOUT: ' + result.stdout)
        console.log('STDERR: ' + result.stderr)

        table+= `<tr><th>HOSTNAME</th><td>${result.stdout}</td></tr>` ;

        json.hostname = result.stdout;
      });

      await ssh.execCommand(`hostnamectl | grep "Operating" `, { cwd:'./' }).then(function(result) {
        console.log('STDOUT: ' + result.stdout)
        console.log('STDERR: ' + result.stderr)

        table+= `<tr><th>S.O</th><td>${result.stdout}</td></tr>` ;

        json.so = result.stdout;
      });

      await ssh.execCommand(`ifconfig | grep ether | awk '{print $2}'`, { cwd:'./' }).then(function(result) {
        console.log('STDOUT: ' + result.stdout)
        console.log('STDERR: ' + result.stderr)


      
         let stringMAC = result.stdout;
         let parts = [];
         parts = stringMAC.split(":");
         let  macBnet = "";
         let contador   = 1;
        
        if( parts.length > 0 ){
            for( let i=0; i<parts.length; i++ ) {

               if(  parts[i].charAt(0) == '0' ){
                    macBnet+=parts[i].charAt(1);
               }else{
                   macBnet+=parts[i];
               }

               if( contador < parts.length ){
                   macBnet+="-";
               }
               contador++;
            }//fin for
        }
       
      //System.out.println("MAC BNET: " + macBnet); 
        table+= `<tr><th>MAC BNET </th><td>${  macBnet.replace(/\s/g,';')}</td></tr>` ;
        table+= `<tr><th>MAC REAL </th><td>${  stringMAC.replace(/\s/g,';')}</td></tr>` ;
        json.macBnet =  macBnet.replace(/\s/g,';');
        json.macReal =  stringMAC.replace(/\s/g,';');
      });


      await ssh.execCommand(`free -m  `, { cwd:'./' }).then(function(result) {
        console.log('STDOUT: ' + result.stdout)
        console.log('STDERR: ' + result.stderr)

        table+= `<tr><th>MEMORIA RAM</th><td>${result.stdout}</td></tr>` ;

        json.ram = result.stdout;
      });

      await ssh.execCommand(`cat /proc/cpuinfo | grep "model name" `, { cwd:'./' }).then(function(result) {
        console.log('STDOUT: ' + result.stdout)
        console.log('STDERR: ' + result.stderr)

        table+= `<tr><th>PROCESADOR</th><td>${result.stdout}</td></tr>` ;

        json.procesador = result.stdout;
      });

      await  ssh.execCommand(`echo "gamble"| sudo -S  dmidecode -t 2 | grep "Product Name" `, { cwd:'./' }).then(function(result) {
        console.log('STDOUT: ' + result.stdout)
        console.log('STDERR: ' + result.stderr)

        table+= `<tr><th>BOARD</th><td>${result.stdout}</td></tr>` ;

        json.board = result.stdout;
      });

      await ssh.execCommand(` cat /sys/block/sda/queue/rotational  `, { cwd:'./' }).then(function(result) {
        console.log('STDOUT: ' + result.stdout)
        console.log('STDERR: ' + result.stderr)

        if( result.stdout ==   0 ){
          json.disco = 'Disco Solido ';
          table+= `<tr><th>DISCO DURO</th><td>Disco Solido`;
        }else{
          table+= `<tr><th>DISCO DURO</th><td>Disco Mecánico`;
          json.disco = 'Disco Mecánico ';
        }

       
      });

      //await ssh.execCommand(`echo "gamble"| sudo -S  parted -l | grep -e Modelo -e Disco`, { cwd:'./' }).then(function(result) {
      await ssh.execCommand(`echo "gamble"| sudo -S lshw -class disk | grep -e descripci -e producto -e serie -e tama`, { cwd:'./' }).then(function(result) { 
       console.log('STDOUT: ' + result.stdout)
       console.log('STDERR: ' + result.stderr)

       table+= `<br>${result.stdout}</td></tr>` ;

        json.disco = json.disco + ''+result.stdout;
       
     });
      

      await ssh.execCommand(`cat /home/gamble/businessnet/ClientePos.sh  | grep BnetPosSlim.sh `, { cwd:'./' }).then(function(result) {
       
        table+= `<tr><th>POSSLIM</th><td>${result.stdout}</td></tr>` ;

        json.posslim = result.stdout;
      });


      await ssh.execCommand(`stat -c ‘%y’ /home/gamble/businessnet/6_COD_PATAMILLONARIA_3.jar `, { cwd:'./' }).then(function(result) {
       
        table+= `<tr><th>JAR PATAM</th><td>${result.stdout}</td></tr>` ;

        json.jarPata = result.stdout;
      });

      await ssh.execCommand(`stat -c ‘%y’ /home/gamble/businessnet/11_COD_BALOTOCP_1.jar`, { cwd:'./' }).then(function(result) {
       
        table+= `<tr><th>JAR BALOTO</th><td>${result.stdout}</td></tr>` ;

        json.jarBaloto = result.stdout;
      });

      await ssh.execCommand(`stat -c ‘%y’ /home/gamble/businessnet/ClientePosSlim-Giros.jar`, { cwd:'./' }).then(function(result) {
       
        table+= `<tr><th>JAR GIROS</th><td>${result.stdout}</td></tr>` ;

        json.jarGiros = result.stdout;
      });

      await ssh.execCommand(`stat -c ‘%y’ /home/gamble/businessnet/CodesaWrapperGiros.jar`, { cwd:'./' }).then(function(result) {
       
        table+= `<tr><th>JAR GIROS W</th><td>${result.stdout}</td></tr>` ;

        json.jarGW = result.stdout;
      });

      

      $("#exampleModalLabel").html( ipPDV +" "+nombrePDV)
      table+="</table>";
      $("#modalBody").html(table);
      
      (!tipo ) ? myModal.show() : '';
      ssh.dispose();

      dataJsonExcel.push(  json );
      
    })
    .catch( (error)=>{
      console.log(error);
      ssh.dispose();
      $("#exampleModalLabel").html( "Error");
      $("#modalBody").html(error);;
      (!tipo ) ? myModal.show() : '';
    });
};

const closePosslim = (event) =>{

  if( confirm( "Realmente desea cerrar el posslim")){
  const ssh = new NodeSSH();

  let  obj                = event.target;
  let  ipPDV              = $.trim( $(obj).data("ip") );
  let  nombrePDV          = $.trim( $(obj).data("pdv") );
  
  myModal.hide();
  $("#exampleModalLabel").html( ipPDV +" "+nombrePDV)
  $("#modalBody").html("Iniciando Proceso de cerrado del posslim");
  myModal.show();

   ssh.connect ({
      host: ipPDV,
      username: data_ftp_ssh.user,
      password: data_ftp_ssh.password,
      port: data_ftp_ssh.port,
      readyTimeout: data_ftp_ssh.tiempoReconexion
    })
    .then( async function() {

      await  ssh.execCommand("kill -9 `ps -ef | grep ClientePosSlim | grep -v grep | awk '{print $2}'`", { cwd:'./' }).then(function(result) {
        console.log('STDOUT: ' + result.stdout);
        console.log('STDERR: ' + result.stderr);
        myModal.hide();
        $("#exampleModalLabel").html( ipPDV +" "+nombrePDV)
        $("#modalBody").html("Posslim Cerrado");
        myModal.show();   
        ssh.dispose();    
      });
    }).catch( (error)=>{
      console.log(error);
      myModal.hide();
      $("#exampleModalLabel").html( "Error");
      $("#modalBody").html(error);;
       myModal.show();
       ssh.dispose();
    });
  }
}

const openVNC = (event) => {

  let  obj                = event.target;
  let  ipPDV              = $.trim( $(obj).data("ip") );
  
  console.log('Abrir VNC '+ipPDV);

  
  let  executablePath = `${data_rutas_app.vnc}`;
  
  let spawn = require('child_process').spawn,
  ls  = spawn('cmd.exe', ['/c', executablePath, ipPDV,'-password',data_vnc.password]);
   
  ls.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
  });
  
  ls.stderr.on('data', function (data) {
      console.log('stderr: ' + data);
      myModal.hide();
      $("#exampleModalLabel").html( "Error");
      $("#modalBody").html(data);
       myModal.show();
  });
   
  ls.on('exit', function (code) {
    //console.log('child process exited with code ' + code);
  });
}

const openPutty = ( event ) => {

  let  obj                = event.target;
  let  ipPDV              = $.trim( $(obj).data("ip") );
  
  console.log('Abrir Putty '+ipPDV);

  let  executablePath = `${data_rutas_app.putty}`;

 
  let spawn = require('child_process').spawn,
  ls  = spawn('cmd.exe', ['/c', executablePath,ipPDV,'-l',`${data_ftp_ssh.user}`,'-pw',`${data_ftp_ssh.password}`]);
   
  ls.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
  });
  
  ls.stderr.on('data', function (data) {
      console.log('stderr: ' + data);
      myModal.hide();
      $("#exampleModalLabel").html( "Error");
      $("#modalBody").html(data);
       myModal.show();
  });
   
  ls.on('exit', function (code) {
    //console.log('child process exited with code ' + code);
  });
}



$("#transTodo").click(function(e){
 
  let  rutaDestino        = $.trim( $("#rutaDestino").val() );
  let  obj                = this;
 
  if( rutaDestino !="" && rutaOrigen!="" ){

    if( !confirm("Realmente desea transferir el archivo ?") ){
      $(obj).attr('disabled', false);
      return;
    }

    $(obj).attr('disabled', true);
  
    $("#listadoPDV > tr").each(function( index, tr ){

        let btn   = $(tr).find('td').children('.btnFtp');
        let dirIp = $.trim( $(tr).find('td.dirIP').text() );
        if( !btn.attr('disabled') ){
            btn.trigger('click');
            console.log('Click '+dirIp);
        }
    });
  }
  else{
    //alert('Especifique la ruta de origen y destino');
    $("#exampleModalLabel").html("Error");
    $("#modalBody").html("Debe Selecciconar la ruta de origen y destino");
    myModal.hide();
    myModal.show();
    
  }
});



$("#hvTodo").click( async function(e){
 

  if( !confirm("Realmente desea generar todo ?") ){
    $(this).attr('disabled', false);
    return;
  }

  let contadorReg = 0;
  let total       = $("#listadoPDV > tr").length;

  $(this).attr('disabled', true);
 
  $("#totalHV").html( contadorReg + " de "+ total).show();

  for ( let i=0; i < total; i++) {

      let btn    =   $("#listadoPDV > tr:eq("+i+")").find('td').children('.btnHV');
      let dirIp  =   $("#listadoPDV > tr:eq("+i+")").find('td.dirIP').text() ;  
      //let zona   =
      console.log( dirIp );

      if( !btn.attr("disabled")){
        //await iperAsync(btn[0]);
        await getHVPDV( btn[0],'todo');
        contadorReg++;
        $("#totalHV").html( contadorReg + " de "+ total);
      }

      //if( contadorReg == 5 ) break;
  }
  exportarExcel();
  $(this).attr('disabled', false);
  
});






const exportarExcel = async( fecha = null) => {
      

  let fechaCompleta = (!fecha) ? getFechaCompleta("_"): fecha;


  let pathExcel  = __dirname+'hv_'+fechaCompleta+'.xlsx';
  let dirName    = 'hv_'+fechaCompleta+'.xlsx';
  const XLSX = require("xlsx")//npm install xlsx
  const newWB = XLSX.utils.book_new();
  const newWS = XLSX.utils.json_to_sheet(dataJsonExcel);
  XLSX.utils.book_append_sheet(newWB,newWS,"ReporteHV")//workbook name as param
  await XLSX.writeFileXLSX(newWB,pathExcel)//file name as param*/
  var link = document.createElement('a');
  link.href = pathExcel;
  link.download = dirName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
} 


const getFechaCompleta = (sep = "/") => {
  let today = new Date();
  let day = today.getDate();
  let month = today.getMonth() + 1;
  let year = today.getFullYear();

  month = ( month < 10 ) ? '0'+month : month; 
  return `${day}${sep}${month}${sep}${year}`
}









