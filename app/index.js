function onSearchData(){
    var id_vin_code = $("#id_vin_code").val();
    var id_user = $("#id_user").val();
    var id_pass = $("#id_pass").val();
    var id_search_term = $("#id_search_term").val();

    if (id_vin_code == "") return;
    if (id_user == "") return;
    if (id_pass == "") return;
    if (id_search_term == "") return;

    var data = {
        "id_vin_code":id_vin_code,
        "id_user":id_user,
        "id_pass":id_pass,
        "id_search_term":id_search_term
    }
    $.post({
        type : "POST",
        url : "./inputData",
        data : {input : data},
        timeout : 2 * 60 * 1000,
        success : function(data){
            if (data){
                console.log(data);
                var jsonData = data;
                
                //Chilton Data
                var jsonChilton = jsonData.Chilton;
                console.log(jsonChilton);
                if (jsonChilton.length > 0){
                    var headers = "";
                    for (var i = 0; i < jsonChilton[0].header.length; i ++){
                        headers = headers + "<th>" + jsonChilton[0].header[i] + "</th>";
                    }
                    $("#id_table_header_chilton").html(headers);

                    var bodys = "";
                    for (var i = 0; i < jsonChilton.length; i ++){
                        bodys = bodys + "<tr><td><strong>" + jsonChilton[i].title + "</strong></td><td></td><td></td></tr>";
                        for (var j = 0; j < jsonChilton[i].body.length; j ++){                            
                            bodys = bodys + "<tr>";
                            for (var k = 0; k < jsonChilton[i].body[j].length; k ++){
                                bodys = bodys + "<td>" + jsonChilton[i].body[j][k] + "</td>";
                            }
                            bodys = bodys + "</tr>";
                        }
                    }
                    $("#id_table_body_chilton").html(bodys);
                }                
                
                //Motor Data
                var jsonMotor = jsonData.Motor;
                if (jsonMotor.length > 0){
                    var bodys = "";
                    for (var i = 0; i < jsonMotor.length; i ++){
                        bodys = bodys + "<tr>";
                        for (var j = 0; j < jsonMotor[i].body[0].length; j ++){
                            bodys = bodys + "<td><strong>" + jsonMotor[i].body[0][j] + "</strong></td>";
                        }
                        bodys = bodys + "</tr>";
                        
                        for (var j = 1; j < jsonMotor[i].body.length; j ++){
                            bodys = bodys + "<tr>";
                            for (var k = 0; k < jsonMotor[i].body[j].length; k ++){
                                bodys = bodys + "<td>" + jsonMotor[i].body[j][k] + "</td>";
                            }
                            for (var k = jsonMotor[i].body[j].length; k < jsonMotor[i].body[0].length; k ++){
                                bodys = bodys + "<td></td>";
                            }
                            bodys = bodys + "</tr>";
                        }                        
                    }
                    $("#id_table_body_motor").html(bodys);
                }
                console.log(jsonMotor);
            }
            console.log(data);
        }
    });
}