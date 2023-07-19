import puppeteer, {Browser, Page} from "puppeteer";


const target: string = '/CustomApp/mainpage.asp';

async function login(page:Page,username:string,password:string) {

        await page.type('#txt_Username', username);
        await page.type('#txt_Password', password);
        await page.click("#loginbutton");
        await page.waitForNavigation

        return await Promise.all([
            page.type('#txt_Username', username),
            page.type('#txt_Password', password),
            page.click("#loginbutton"),
            page.waitForResponse(response =>
                response.url() === target && response.status() === 200)

        ])
}

export default login
