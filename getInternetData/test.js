const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const fs = require('fs');

// 从 config.json 文件中读取 proxyListTest
const { proxyListTest } = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// 验证 URL 列表
const validationUrls = [
    'http://www.xiaohongshu.com/explore',
];


// 检查单个代理是否对所有验证 URL 都可用
async function checkProxy(proxy) {
    for (const url of validationUrls) {
        try {
            const proxyUrl = new URL(proxy);
            const agentOptions = {
                host: proxyUrl.hostname,
                port: proxyUrl.port,
                protocol: proxyUrl.protocol,
                rejectUnauthorized: false
            };
            const agent = new HttpsProxyAgent(agentOptions);
            await axios.get(url, {
                httpsAgent: agent,
                timeout: 5000,
                rejectUnauthorized: false
            });
            console.log(`${proxy} 对 ${url} 可用`);
        } catch (error) {
            // 将不可用的代理添加到 lajproxyList
            console.log(`${proxy} 对 ${url} 不可用: ${error.message}`);
            return false;
        }
    }
    return true;
}

// 验证所有代理
async function validateProxies() {
    const validProxies = [];
    for (const proxy of proxyListTest) {
        const isValid = await checkProxy(proxy);
        if (isValid) {
            validProxies.push(proxy);
        }
    }
    return validProxies;
}

// 将可用代理列表添加到 JSON 文件的 proxyList 字段中
function updateProxyListInConfig(validProxies) {
    try {
        // 读取配置文件
        const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

        // 更新 proxyList 字段，去重添加可用代理
        const newProxyList = [...new Set([...config.proxyList, ...validProxies])];
        config.proxyList = newProxyList;

        // 将更新后的配置写回文件
        const updatedJson = JSON.stringify(config, null, 2);
        fs.writeFileSync('config.json', updatedJson, 'utf8');
        console.log('可用代理已成功添加到 proxyList 字段中');
    } catch (error) {
        console.error('更新配置文件时出错:', error);
    }
}

// 主函数
async function main() {
    const validProxies = await validateProxies();
    if (validProxies.length) {
        updateProxyListInConfig(validProxies);
    }
    console.log('可用代理列表:', validProxies);
}

main();