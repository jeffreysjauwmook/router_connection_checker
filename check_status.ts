#!/usr/bin/env ts-node
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
                console.log(new Date().toLocaleString());
                let router: Router = routers[n];
                let url = router['url'];
                let username = router['username'];
                let password = router['password'];
                let retry = 0;
                try{
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
                    let connected: boolean = await page.goto(url).then(()=>{
                        return true;
                    }).catch(()=>{
                        return false;
                    });
                    if(!connected){
                        if (retry <= 3){
                            retry++;
                            console.log("unable to connect to router, retrying("+retry+"/3)...");
                            await new Promise(resolve => setTimeout(resolve, 60000))                        
                        }else{
                            console.log("unable to connect to router, skipping...");
                            n++;
                        }
                    
                        continue;
                    }
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
                        console.log("connection not registered , restarting modem...")
                        await page.goto(url + "/html/ssmp/accoutcfg/ontmngt.asp");
                        await page.waitForSelector("#ResetButton")
                        await page.click("#btnReboot")
                        await browser.close()
                    }
                    if(n == routers.length-1){
                        console.log("waiting 5 mins")
                        await new Promise(resolve => setTimeout(resolve, 300000))
                        n = 0;
                        console.log("again...");


                    }else{
                        n++;
                    }
                }catch(error){
                    console.log("an error occurred");
                    console.log(error);
                    console.log("skipping...");
                    continue;
                }
            }
        
    })();


