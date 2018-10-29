(function() {
    var express = require('express');
    var http = require('http');
    var bodyParser = require('body-parser');
    var chromedriver = require('chromedriver');
    var webdriver = require('selenium-webdriver'),
        chrome = require('selenium-webdriver/chrome'),
        JavascriptExecutor = webdriver.JavascriptExecutor,
        By = webdriver.By,
        until = webdriver.until,
        options = new chrome.Options();
        options.addArguments('headless');
        options.addArguments('disable-gpu');

    var app = express();

    app.set('port', 8080);
    app.use(express.static(__dirname + '/app'));
    app.use(bodyParser.json({limit : '50mb'}));
    app.use(bodyParser.urlencoded({extended : true}));

    app.post('/inputData', function(req, res){
        var inputdata = req.body.input;
        
        var username = inputdata.id_user;
        var password = inputdata.id_pass;
        var vincode = inputdata.id_vin_code;
        var searchterm = inputdata.id_search_term;

        console.log(username);
        console.log(password);
        console.log(vincode);
        console.log(searchterm);
        
        doProcess(username, password, vincode, searchterm, res);
    });

    async function doProcess(username, password, vincode, searchterm, res){
        var driver = new webdriver.Builder()
            .forBrowser('chrome')
            // .setChromeOptions(options)
            .build();

        g_bIsExpand19 = false;
        g_bIsExpand56 = false;
        g_nExpandDoc19 = 0;
        g_nExpandDoc56 = 0;
        var g_jsonData19 = [];
        var g_jsonData56 = [];

        await driver.get('https://www.identifix.com');
        await driver.wait(until.elementLocated(By.name("UserName")));

        await driver.findElement(By.name("UserName")).sendKeys(username);
        await driver.findElement(By.name("Password")).sendKeys(password);
        await driver.findElement(By.id("Login")).click();
        await driver.sleep(3000 * 1);     
        
        // checking license
        console.log("checking License Page");
        var strPageTitle = await driver.getTitle();
        if (strPageTitle == "License Release"){
            console.log("license page moduel");
            await driver.findElement(By.id("select-all-checkboxes")).click();
            await driver.findElement(By.id("bt-update")).click();
            await driver.sleep(1000 * 1);
            await driver.wait(until.elementLocated(By.id("bt-done")));
            await driver.findElement(By.id("bt-done")).click();
            await driver.sleep(1000 * 1);
        }

        console.log("select vehicle tab");
        await driver.wait(until.elementLocated(By.xpath('(//ul[@id="select-vehicle-tabs"]//li)[1]')));
        await driver.findElement(By.xpath('(//ul[@id="select-vehicle-tabs"]//li)[1]')).click();
        await driver.wait(until.elementLocated(By.id("CreateVehicle_suggest_box")));

        console.log("input vin code");
        await driver.findElement(By.id("CreateVehicle_suggest_box")).sendKeys(vincode);

        try{
            await driver.wait(until.elementLocated(By.className("FFVS_Item")), 10 * 1000);
            await driver.findElement(By.id("CreateVehicle_suggest_box")).sendKeys(webdriver.Key.ARROW_DOWN);
            await driver.sleep(500);
            await driver.findElement(By.id("CreateVehicle_suggest_box")).sendKeys(webdriver.Key.ENTER);
        }catch(e){
            return null;
        }
        await driver.wait(until.elementLocated(By.id("tb-search-box")));

        console.log("Input search term and press Enter");
        await driver.findElement(By.id("tb-search-box")).sendKeys(searchterm);
        await driver.findElement(By.id("tb-search-box")).sendKeys(webdriver.Key.ENTER);
        await driver.wait(until.elementLocated(By.id("OemSearchResultPanel")));


        // Get Chilton Data
        try{
            // AssetType_56 : CHILTON Labor
            // AssetType_19 : MOTOR Parts & Labor
            await driver.wait(until.elementLocated(By.xpath("//div[@class='search-result-content']//div[@id='AssetType_56']//div[@class='panel-body']")), 10 * 1000);
            
            console.log("=========== Expand all dynatree urls ==========");
            ExpandAllDynaTrees56();

            await driver.wait(async function(){
                if (g_bIsExpand56 == true && g_bIsExpand19 != true){
                    console.log("Next Step to Expand 19 Trees");
                    // Get Motor Data
                    try{
                        await driver.wait(until.elementLocated(By.xpath("//div[@class='search-result-content']//div[@id='AssetType_19']//div[@class='panel-body']")), 10 * 1000);                
                        console.log("=========== Expand all dynatree urls ==========");
                        ExpandAllDynaTrees19();
                    }catch(e){
                        noMotor();
                    }
                    return true;
                }else await driver.sleep(300);
            });
            await driver.wait(async function(){
                if (g_bIsExpand56 == true && g_bIsExpand19 == true){
                    for (var i = 1; i <= g_nExpandDoc56; i ++){
                        await GetDocsData56(i);
                    }
                    for (var i = 1; i <= g_nExpandDoc19; i ++){
                        await GetDocsData19(i);
                    }

                    quiteAll();
                    // console.log(g_jsonData56);
                    // console.log(g_jsonData19);
                    
                    console.log("===============================================================================");
                    console.log("===============================================================================");
                    console.log("================================ All Completed ================================");
                    console.log("===============================================================================");
                    console.log("===============================================================================");
                    return true;
                }else await driver.sleep(300);
            });
        }catch(e){
            noChilton();
        }

        async function ExpandAllDynaTrees56(){      
            try{
                await driver.findElement(By.xpath("//div[@class='search-result-content']//div[@id='AssetType_56']//div[@class='panel-body']//a[@class='dynatree-title']"), 2000);
                await driver.findElement(By.xpath("//div[@class='search-result-content']//div[@id='AssetType_56']//div[@class='panel-body']//a[@class='dynatree-title']/../span[@class='dynatree-expander']")).click();
                await driver.sleep(2000);
                ExpandAllDynaTrees56();
            }catch(e){
                ExpandAllDocs56();
            }
        }
        async function ExpandAllDocs56(){
            try{
                await driver.findElement(By.xpath("//div[@class='search-result-content']//div[@id='AssetType_56']//div[@class='panel-body']//a[@class='dynatree-title document-link']"), 2000);
                await driver.findElement(By.xpath("//div[@class='search-result-content']//div[@id='AssetType_56']//div[@class='panel-body']//a[@class='dynatree-title document-link']/../span[@class='dynatree-icon']")).click();
                g_nExpandDoc56 ++;
                await driver.sleep(2000);
                ExpandAllDocs56();
            }catch(e){
                console.log("All Expanded for 56 trees : " + g_nExpandDoc56);
                g_bIsExpand56 = true;
            }
        }
        async function ExpandAllDynaTrees19(){
            try{
                await await driver.findElement(By.xpath("//div[@class='search-result-content']//div[@id='AssetType_19']//div[@class='panel-body']//a[@class='dynatree-title']"), 2000);
                await driver.findElement(By.xpath("//div[@class='search-result-content']//div[@id='AssetType_19']//div[@class='panel-body']//a[@class='dynatree-title']/../span[@class='dynatree-expander']")).click();
                await driver.sleep(2000);
                ExpandAllDynaTrees19();
            }catch(e){
                ExpandAllDocs19();
            }
        }
        async function ExpandAllDocs19(){
            try{
                await driver.findElement(By.xpath("//div[@class='search-result-content']//div[@id='AssetType_19']//div[@class='panel-body']//a[@class='dynatree-title document-link' and @title='All']"), 2000);
                await driver.findElement(By.xpath("//div[@class='search-result-content']//div[@id='AssetType_19']//div[@class='panel-body']//a[@class='dynatree-title document-link' and @title='All']/../span[@class='dynatree-icon']")).click();
                g_nExpandDoc19 ++;
                await driver.sleep(2000);
                ExpandAllDocs19();
            }catch(e){
                console.log("All Expanded for 19 trees : " + g_nExpandDoc19);
                g_bIsExpand19 = true;
            }
        }
        async function GetDocsData56(index){
            return new Promise(async resolve => {
                var JSONResult = {title : '', header : [], body : []};

                try{
                    var namePath = "(//div[@class='search-result-content']//div[@id='AssetType_56']//div[@class='panel-body']//div[@id='divSectionBody']//table//div[@class='name-container'])[" + index + "]";
                    var elem_title = await driver.findElement(By.xpath(namePath));
                    var attr_title = await elem_title.getAttribute("innerHTML");
                    attr_title = attr_title.replace("</span>", "");
                    attr_title = attr_title.replace(/<[^}]*>/g, '');
                    JSONResult.title = attr_title;
                }catch(e){
                    console.log("Exception GetDocsData56-Title");
                }

                try{
                    var headerPath = "(//div[@class='search-result-content']//div[@id='AssetType_56']//div[@class='panel-body']//div[@id='divSectionBody']//table//table//thead//tr)[" + index + "]";
                    var elem_header = await driver.findElement(By.xpath(headerPath));
                    var attr_header = await elem_header.getAttribute("innerHTML");
                    attr_header = replaceAll(attr_header, ' class="value-column"', '');
                    attr_header = replaceAll(attr_header, '  ', '');
                    var headers = spliteReg(attr_header, "<td>", "</td>");
                    JSONResult.header = headers;
                }catch(e){
                    console.log("Exception GetDocsData56-Header");
                }

                try{
                    var bodyPath = "(//div[@class='search-result-content']//div[@id='AssetType_56']//div[@class='panel-body']//div[@id='divSectionBody']//table//table//tbody)[" + index + "]";
                    var elem_body = await driver.findElement(By.xpath(bodyPath));
                    var attr_body = await elem_body.getAttribute("innerHTML");
                    attr_body = replaceAll(attr_body, ' class="value-column"', '');
                    attr_body = replaceAll(attr_body, ' class="title"', '');
                    attr_body = replaceAll(attr_body, ' class="title-level-1"', '');
                    attr_body = replaceAll(attr_body, ' class="title-level-2"', '');
                    attr_body = replaceAll(attr_body, ' class="title-level-3"', '');            
                    attr_body = replaceAll(attr_body, ' class="title dotted-border"', '');
                    attr_body = replaceAll(attr_body, ' class="right-padding text-italic"', '');
                    attr_body = replaceAll(attr_body, ' class="right-padding"', '');
                    attr_body = replaceAll(attr_body, '  ', '');
                    attr_body = replaceAll(attr_body, '<span>', '');
                    attr_body = replaceAll(attr_body, '</span>', '');
                    attr_body = replaceAll(attr_body, '<div>', '');
                    attr_body = replaceAll(attr_body, '</div>', '');
                    attr_body = replaceAll(attr_body, '\n', '');                            
                    var bodys = spliteReg(attr_body, "<tr>", "</tr>");
                    var bodyarr = [];
                    for (var i = 0; i < bodys.length; i ++){
                        var arr = spliteReg(bodys[i], "<td>", "</td>");
                        bodyarr.push(arr);
                    }
                    JSONResult.body = bodyarr;
                }catch(e){
                    console.log("Exception GetDocsData56-Body");
                }

                await driver.sleep(1000);
                g_jsonData56.push(JSONResult);

                resolve(true);
            });
        }
        function GetDocsData19(index){
            return new Promise(async resolve => {
                var JSONResult = {title : '', header : [], body : []};      

                try{
                    var titlePath = "(//div[@class='search-result-content']//div[@id='AssetType_19']//div[@class='panel-body']//div[@id='divSectionBody']//div[@class='part-labor-header'])[" + index + "]/../../../../../../../../../../../../span/a";
                    var elem_title = await driver.findElement(By.xpath(titlePath));
                    var attr_title = await elem_title.getAttribute("innerHTML");
                    attr_title = removeProperties(attr_title, ' class="');
                    attr_title = replaceAll(attr_title, "<span>", "");
                    attr_title = replaceAll(attr_title, "</span>", "");
                    attr_title = replaceAll(attr_title, "amp", "");
                    attr_title = replaceAll(attr_title, '&nbsp;', '');
                    JSONResult.title = attr_title;
                }catch(e){
                    console.log("Exception GetDocsData19-Name");
                }

                try{
                    var namePath = "(//div[@class='search-result-content']//div[@id='AssetType_19']//div[@class='panel-body']//div[@id='divSectionBody']//div[@class='part-labor-header'])[" + index + "]";
                    var elem_path = await driver.findElement(By.xpath(namePath));
                    var attr_path = await elem_path.getAttribute("innerHTML");
                    JSONResult.header = attr_path;
                }catch(e){
                    console.log("Exception GetDocsData19-Header");
                }

                try{
                    var headerPath = "(//div[@class='search-result-content']//div[@id='AssetType_19']//div[@class='panel-body']//div[@id='divSectionBody']//div[@class='part-labor-content']//table[@class='part-labor-table'])[" + index + "]";
                    var elem_header = await driver.findElement(By.xpath(headerPath));
                    var attr_header = await elem_header.getAttribute("innerHTML");
                    attr_header = replaceAll(attr_header, '\n', '');
                    attr_header = replaceAll(attr_header, '  ', '');

                    var strTableStart = '<td class="part-labor-no-wrap-text"><div';
                    var nIndex = attr_header.indexOf(strTableStart);
                    while (nIndex != -1){
                        var temp = "";
                        temp = temp + attr_header.substr(0, nIndex + strTableStart.length - 4);

                        var strStartKeyword = '<td class="part-labor-no-wrap-text">';
                        var nTextStart = attr_header.indexOf(strStartKeyword, nIndex+1);
                        var nTextEnd = attr_header.indexOf('</td>', nTextStart);
                        if ((nTextStart != -1) && (nTextEnd != -1)){
                            nTextStart = nTextStart + strStartKeyword.length;
                            temp = temp + attr_header.substr(nTextStart, nTextEnd - nTextStart);
                        }

                        var strEndKeyword = '</table></div>';
                        var nEnd = attr_header.indexOf(strEndKeyword, nTextEnd + 1);
                        temp = temp + attr_header.substr(nEnd + strEndKeyword.length, attr_header.length - nEnd - strEndKeyword.length);
                        
                        attr_header = temp;
                        nIndex = attr_header.indexOf(strTableStart);
                    }

                    // remove all classes and styles.
                    attr_header = removeProperties(attr_header, ' class="');
                    attr_header = removeProperties(attr_header, ' style="');
                    attr_header = removeProperties(attr_header, ' colspan="');
                    attr_header = replaceAll(attr_header, '<strong>', '');
                    attr_header = replaceAll(attr_header, '</strong>', '');
                    attr_header = replaceAll(attr_header, '<span>', '');
                    attr_header = replaceAll(attr_header, '</span>', '');
                    attr_header = replaceAll(attr_header, '&nbsp;', '');
                    attr_header = replaceAll(attr_header, 'amp;', '');

                    // make array
                    var bodys = spliteReg(attr_header, "<tr>", "</tr>");
                    var bodyarr = [];
                    for (var i = 0; i < bodys.length; i ++){
                        var arr = spliteReg(bodys[i], "<td>", "</td>");
                        bodyarr.push(arr);
                    }
                    JSONResult.body = bodyarr;
                }catch(e){
                    console.log(e);
                    console.log("Exception GetDocsData19-Body");
                }

                await driver.sleep(1000);
                g_jsonData19.push(JSONResult);

                return resolve(true);
            });
        }
        //************************ Sub Functions ********************/
        async function noChilton(){
            console.log("no Chilton data");            
            g_bIsExpand56 = true;         
        }
        async function noMotor(){
            g_bIsExpand19 = true;
            console.log("no Motor data");
        }
        async function quiteAll(){
            res.json({Chilton : g_jsonData56, Motor : g_jsonData19});
        }
        function removeProperties(strText, strTerm){        
            var nIndex = strText.indexOf(strTerm);
            while (nIndex != -1){
                var strTemp = "";
                var nTag = strText.indexOf('">', nIndex + 1);
                if (nTag > -1){
                    strTemp = strTemp + strText.substr(0, nIndex);
                    strTemp = strTemp + strText.substr(nTag + 1, strText.length - nTag - 1);
                }
                strText = strTemp;
                nIndex = strText.indexOf(strTerm);
            }        
            return strText;
        }
        function replaceAll(str, find, replace){
            return str.replace(new RegExp(find, 'g'), replace);
        }
        function spliteReg(str, first, end){
            var array = [];
            
            var regExString = new RegExp(first + "(.*?)" + end, "ig");        
            var splitResult;        
            do{
                splitResult = regExString.exec(str);
                if (splitResult) {
                    array.push(splitResult[1]);
                }
            }while(splitResult);

            return array;
        }
    }

    
    http.createServer(app).listen(app.get('port'), function(){
        console.log("server is established on port : " + app.get('port'));
    });
  }).call(this);
  