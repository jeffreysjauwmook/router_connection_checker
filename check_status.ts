import puppeteer, {Browser, Page} from "puppeteer";
import * as fs from "fs";
import YAML from 'yaml'
import {Router} from "./Router"
    (async ()=> {
            console.log("reading config file...")
            const file = fs.readFileSync('./routers.yml', 'utf8')
            const routers : Router[] = YAML.parse(file);
            console.log("number of routers to check : "+ routers.length)
            let n  : number  = 0;
            while(n < routers.length){
                let router: Router = routers[n];
                let url = router['url'];
                let username = router['username'];
                let password = router['password'];
                console.log("checking router " + url);
                const browser: Browser = await puppeteer.launch(
                    {
                    headless: 'new'
                    });
                let page: Page = await browser.newPage();
                // confirm restart dialog
                page.on('dialog', async dialog => {
                    if (dialog.type() == "confirm" && dialog.message() == "Unsaved data will be lost. Are you sure you want to restart the device?") {
                        await dialog.accept();
                    }
                });
                await page.goto(url);
                await page.setViewport({width: 1080, height: 1024});
                 let title = await page.title();
                 if(title != "HG8245W5-6T"){
                         console.log("incorrect router type")
                         await browser.close()
                 }

                await page.type('#txt_Username', username);
                await page.type('#txt_Password', password);
                await page.click("#loginbutton");
                await page.waitForFrame(async frame => {
                    return frame.url() === url + '/CustomApp/mainpage.asp';
                });
                await page.goto(url + "/html/ssmp/smartontinfo/smatontinfo.asp")
                await page.waitForSelector("div#SmartOntInfo div#registerinfo div#itmsinfo div#itmsinfovalue")
                console.log("checking status : ");
                let pageString = await page.content();
                if (pageString.match("Registration succeeded")) {
                    console.log("connection registered, closing...")
                    await browser.close();
                } else {
                    console.log("connection not registered , resetting modem...")
                    await page.goto(url + "/html/ssmp/accoutcfg/ontmngt.asp");
                    await page.waitForSelector("#ResetButton")
                    await page.click("#btnReboot")
                    await browser.close()
                }
                console.log("end...")
                if(n < routers.length-1){
                    n = 0;
                    console.log("reset list");
                    setTimeout(()=>{console.log("again...")},10000)

                }else{
                    n++;
                }
            }
    })();


