import puppeteer, {Browser, Page} from "puppeteer";
import * as fs from "fs";
import YAML from 'yaml'
import {Router} from "./Router"
import login from './login'
    (async ()=> {
        console.log("reading config file...")
        const file = fs.readFileSync('./routers.yml', 'utf8')
        const routers : Router[] = YAML.parse(file);
        console.log("number of routers to check : "+ routers.length)
        for(let  n =0;  n < routers.length; n++){
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

        await login(page,username,password);


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
    }
    })();


