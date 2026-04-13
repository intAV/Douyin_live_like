const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0";

// 检测运行环境
const isExejsEnv = typeof process === 'undefined' || !process.argv;
const isNodeEnv = !isExejsEnv && typeof process !== 'undefined' && process.argv;

let window, _realProcess;

// 根据环境初始化
if (isNodeEnv) {
    // Node.js 环境：使用 JSDOM
    const dom = new JSDOM(`<!DOCTYPE html><html><body><canvas id="canvas"></canvas></body></html>`, {
        url: "https://live.douyin.com/",
        referrer: "https://live.douyin.com/",
        userAgent: UA,
        pretendToBeVisual: true,
        resources: "usable"
    });

    window = dom.window;
    global.window = global.top = global.self = window;
    global.document = window.document;
    global.navigator = window.navigator;
    global.location = window.location;
    global.XMLHttpRequest = window.XMLHttpRequest;

    const originalXHROpen = window.XMLHttpRequest.prototype.open;
    const originalXHRSend = window.XMLHttpRequest.prototype.send;

    window.XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        this._url = url;
        return originalXHROpen.call(this, method, url, async !== false, user, password);
    };

    window.XMLHttpRequest.prototype.send = function(body) {
        if (this._url && this._url.includes('a_bogus')) {
            try {
                const urlObj = new URL(this._url);
                const abogus = urlObj.searchParams.get('a_bogus');
                if (abogus) {
                    window.temp_a_bogus = abogus;
                }
            } catch (e) {}
        }
        return originalXHRSend.call(this, body);
    };

    Object.defineProperties(window.navigator, {
        'webdriver': { get: () => false, configurable: false },
        'plugins': { 
            get: () => ({
                length: 5,
                item: () => null,
                namedItem: () => null,
                refresh: () => {}
            }),
            configurable: false 
        },
        'languages': { get: () => ['zh-CN', 'zh', 'en'], configurable: false },
        'platform': { get: () => 'Win32', configurable: false },
        'hardwareConcurrency': { get: () => 8, configurable: false },
        'deviceMemory': { get: () => 8, configurable: false },
        'maxTouchPoints': { get: () => 0, configurable: false },
        'userAgent': { get: () => UA, configurable: false },
        'onLine': { get: () => true, configurable: false }
    });

    const vmpPath = path.join(__dirname, "vmp.js");
    if (fs.existsSync(vmpPath)) {
        try {
            const vmpCode = fs.readFileSync(vmpPath, "utf-8");
            eval(vmpCode);
        } catch (e) {
            console.error("VMP 执行错误: " + e.message);
        }
    }

    // 初始化 bdms
    if (window.bdms && window.bdms.init) {
        try {
            window.bdms.init({
                "aid": 6383,
                "pageId": 7571,
                "paths": [
                    "^/webcast/",
                    "^/aweme/v1/",
                    "^/aweme/v2/",
                    "/v1/message/send",
                    "^/live/",
                    "^/captcha/",
                    "^/ecom/"
                ],
                "boe": false,
                "ddrt": 8.5,
                "ic": 8.5
            });
        } catch (e) {
            console.error("bdms.init 错误: " + e.message);
        }
    }
} 

// 主函数获取签名
async function get_a_bogus(query) {
    return new Promise((resolve) => {
        const xhr = new window.XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                resolve(window.temp_a_bogus || null);
            }
        };
        xhr.open("GET", "https://live.douyin.com/webcast/room/like/?" + query, true);
        xhr.setRequestHeader("user-agent", UA);
        xhr.send();
        
        setTimeout(() => {
            console.error("超时未获取 a_bogus");
            resolve(null);
        }, 5000);
    });
}

// Node.js 命令行模式
if (isNodeEnv && process.argv[2]) {
    (async () => {
        const input = process.argv[2];
        if (!input) {
            console.error("缺少参数");
            process.exit(1);
        }

        // console.log("正在初始化 VMP 环境，请稍候 (5s)...");
        await new Promise(resolve => setTimeout(resolve, 5000)); 
        // -------------------------

        const bogus = await get_a_bogus(input);
        
        if (bogus) {
            console.log(bogus);
            process.exit(0);
        } else {
            console.error("未能获取有效的 a_bogus");
            process.exit(1);
        }
    })();
}